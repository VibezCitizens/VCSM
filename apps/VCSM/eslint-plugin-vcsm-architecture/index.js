/** VCSM Architecture ESLint Plugin — enforces layering and governance contracts */

const path = require('path');

module.exports = {
  rules: {
    // ── Existing rules ─────────────────────────────────────────────────────────

    /** Forbid supabase.auth.getUser() inside DAL files */
    'no-dal-auth-leak': {
      meta: {
        type: 'problem',
        docs: { description: 'supabase.auth.getUser() must not appear in DAL files' },
        messages: { forbidden: 'supabase.auth.getUser() is forbidden in DALs — resolve identity in the controller layer.' },
      },
      create(context) {
        const filename = context.getFilename();
        if (!filename.includes('/dal/') && !filename.endsWith('.dal.js')) return {};
        return {
          CallExpression(node) {
            const callee = node.callee;
            if (
              callee.type === 'MemberExpression' &&
              callee.object?.type === 'MemberExpression' &&
              callee.object?.property?.name === 'auth' &&
              callee.property?.name === 'getUser'
            ) {
              context.report({ node, messageId: 'forbidden' });
            }
          },
        };
      },
    },

    /** Forbid importing another feature's non-adapter internals */
    'adapter-boundary': {
      meta: {
        type: 'problem',
        docs: { description: 'Cross-feature imports must go through an approved public surface (adapter, /adapters/ folder, or the feature index barrel)' },
      },
      create(context) {
        const filename = context.getFilename();
        if (!filename.includes('/features/')) return {};

        const currentFeature = filename.split('/features/')[1]?.split('/')[0];

        return {
          ImportDeclaration(node) {
            const src = node.source.value;
            if (!src.includes('/features/') && !src.startsWith('@/features/')) return;

            const afterFeature = src.split('/features/')[1] ?? '';
            const importedFeature = afterFeature.split('/')[0];
            const isSameFeature = importedFeature === currentFeature;

            // Approved public surfaces — already used as public entry points across the codebase:
            //   A. *.adapter.* files
            //   B. anything inside an /adapters/ folder
            //   C. the feature's top-level index barrel (curated public API)
            // Deep internals (controllers/, model/, dal/, stores, arbitrary files) remain rejected.
            const withinFeature = afterFeature.split('/').slice(1).join('/'); // path under the feature root
            const isAdapterSuffix = src.includes('.adapter');
            const isAdaptersFolder = afterFeature.includes('/adapters/');
            const isFeatureBarrel =
              withinFeature === '' ||
              withinFeature === 'index' ||
              withinFeature.startsWith('index.');
            const isApprovedSurface = isAdapterSuffix || isAdaptersFolder || isFeatureBarrel;

            if (isSameFeature || isApprovedSurface) return;

            context.report({
              node,
              message: `Cross-feature boundary violation. Import from another feature only through an approved public surface (adapter, /adapters/ folder, or index barrel): ${src}`,
            });
          },
        };
      },
    },

    /** Forbid independent local actorId state — must use useIdentity() */
    'single-source-actor': {
      meta: {
        type: 'problem',
        docs: { description: 'actorId must come from useIdentity(), not local state' },
        messages: { forbidden: 'Local actorId state detected. Derive actorId from useIdentity() only.' },
      },
      create(context) {
        return {
          CallExpression(node) {
            const calleeName = node.callee.name;
            if (!['useState', 'useRef', 'useMemo'].includes(calleeName)) return;
            const parent = node.parent;
            if (
              parent?.type === 'VariableDeclarator' &&
              parent.id?.type === 'ArrayPattern'
            ) {
              const firstName = parent.id.elements?.[0]?.name ?? '';
              if (/actorId/i.test(firstName)) {
                context.report({ node, messageId: 'forbidden' });
              }
            }
          },
        };
      },
    },

    /** Forbid screens/views importing directly from controllers or DAL */
    'no-direct-layer-skip': {
      meta: {
        type: 'problem',
        docs: { description: 'Screens must not import directly from controller or DAL layers' },
        messages: { forbidden: 'Screen "{{file}}" imports directly from "{{path}}". Use a hook instead.' },
      },
      create(context) {
        const filename = context.getFilename();
        if (!/Screen\.(js|jsx)$|View\.(js|jsx)$/.test(filename)) return {};
        return {
          ImportDeclaration(node) {
            const src = node.source.value;
            if (src.includes('/controllers/') || src.includes('/dal/')) {
              context.report({
                node,
                messageId: 'forbidden',
                data: { file: filename.split('/').pop(), path: src },
              });
            }
          },
        };
      },
    },

    // ── New rules ──────────────────────────────────────────────────────────────

    /** Forbid .select('*') in DAL files — DAL contract §2.1 */
    'no-select-star': {
      meta: {
        type: 'problem',
        docs: { description: 'Forbid .select("*") in DAL files — use explicit column projection' },
        messages: { forbidden: '.select("*") is forbidden in DALs. Use an explicit column list.' },
      },
      create(context) {
        const filename = context.getFilename();
        if (!filename.includes('/dal/') && !filename.endsWith('.dal.js')) return {};
        return {
          CallExpression(node) {
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.property?.name === 'select' &&
              node.arguments.length === 1 &&
              node.arguments[0]?.value === '*'
            ) {
              context.report({ node, messageId: 'forbidden' });
            }
          },
        };
      },
    },

    /** Forbid createTTLCache — Architecture Governance (TTL deprecation) */
    'no-ttl-cache': {
      meta: {
        type: 'problem',
        docs: { description: 'TTL caches are deprecated — prefer React Query for server state' },
        messages: { forbidden: 'createTTLCache is deprecated. Use React Query (useQuery / useMutation) instead.' },
      },
      create(context) {
        return {
          CallExpression(node) {
            const callee = node.callee;
            const name =
              callee.name ??
              (callee.type === 'MemberExpression' ? callee.property?.name : null);
            if (name === 'createTTLCache') {
              context.report({ node, messageId: 'forbidden' });
            }
          },
        };
      },
    },

    /** Warn when hooks/screens manually fetch server data instead of using React Query */
    'react-query-preferred': {
      meta: {
        type: 'suggestion',
        docs: { description: 'Prefer React Query for server state over manual useState + useEffect fetches' },
        messages: { manualFetch: 'Manual server fetch detected. Prefer useQuery / useMutation from React Query.' },
      },
      create(context) {
        const filename = context.getFilename();
        if (!filename.includes('/hooks/') && !filename.includes('/screens/')) return {};

        let hasUseEffect = false;
        let hasServerCall = false;

        return {
          ImportDeclaration(node) {
            const src = node.source.value;
            if (src.includes('supabase') || src.includes('@supabase')) {
              hasServerCall = true;
            }
          },
          CallExpression(node) {
            const name = node.callee.name;
            if (name === 'useEffect') hasUseEffect = true;
            if (
              node.callee.type === 'MemberExpression' &&
              (node.callee.property?.name === 'from' ||
                node.callee.property?.name === 'fetch')
            ) {
              hasServerCall = true;
            }
            if (name === 'fetch') hasServerCall = true;
          },
          'Program:exit'(node) {
            if (hasUseEffect && hasServerCall) {
              context.report({ node, messageId: 'manualFetch' });
            }
          },
        };
      },
    },

    /**
     * Profiles domain boundary — enforces the citizen/vport/shared logical zones
     * inside features/profiles/. Zones are path-based (no physical folders required):
     *   vport    = kinds/vport/** or adapters/kinds/vport/**
     *   citizen  = kinds/citizen/**
     *   adapters = adapters/** (shared-level public surface, excluding the vport bridges)
     *   shared   = everything else under features/profiles/
     *   dispatch = the 3 whitelisted dispatcher files (exempt — may cross zones)
     * Matrix: citizen↛vport, vport↛citizen, shared↛{citizen,vport}, adapters↛{citizen,vport}.
     * Covers static imports, `export … from` re-exports, and dynamic import().
     */
    'profiles-domain-boundary': {
      meta: {
        type: 'problem',
        docs: { description: 'Profiles citizen/vport/shared zones must not cross; dispatcher whitelist exempt' },
        messages: {
          forbidden: 'Profiles boundary violation: {{from}} zone must not import {{to}} zone ({{src}}).',
        },
      },
      create(context) {
        const MARKER = '/features/profiles/';
        const ALIAS = '@/features/profiles/';
        const DISPATCH = new Set([
          'kinds/profileKindRegistry.js',
          'screens/ActorProfileScreen.jsx',
          'screens/views/ActorProfileViewScreen.jsx',
        ]);

        const relFromAbs = (abs) => {
          const a = abs.replace(/\\/g, '/');
          const i = a.indexOf(MARKER);
          return i === -1 ? null : a.slice(i + MARKER.length);
        };

        const zoneOf = (rel) => {
          if (DISPATCH.has(rel)) return 'dispatch';
          if (rel.startsWith('kinds/vport/') || rel.startsWith('adapters/kinds/vport/')) return 'vport';
          if (rel.startsWith('kinds/citizen/')) return 'citizen';
          if (rel.startsWith('adapters/')) return 'adapters';
          return 'shared';
        };

        const fileAbs = context.getFilename().replace(/\\/g, '/');
        const fromRel = relFromAbs(fileAbs);
        if (fromRel === null) return {}; // not a profiles file
        const fromZone = zoneOf(fromRel);
        if (fromZone === 'dispatch') return {}; // whitelisted dispatcher — exempt

        const dir = path.posix.dirname(fileAbs);

        const check = (node, src) => {
          if (typeof src !== 'string') return;

          let targetRel = null;
          if (src.startsWith(ALIAS)) {
            targetRel = src.slice(ALIAS.length);
          } else if (src.startsWith('.')) {
            targetRel = relFromAbs(path.posix.normalize(path.posix.join(dir, src)));
            if (targetRel === null) return; // resolves outside profiles
          } else {
            return; // external import (other feature / shared / state / node_modules)
          }

          const toZone = zoneOf(targetRel);
          // Only the two kind zones are protected destinations.
          if (toZone === 'vport' && fromZone !== 'vport') {
            context.report({ node, messageId: 'forbidden', data: { from: fromZone, to: 'vport', src } });
          } else if (toZone === 'citizen' && fromZone !== 'citizen') {
            context.report({ node, messageId: 'forbidden', data: { from: fromZone, to: 'citizen', src } });
          }
        };

        return {
          ImportDeclaration(node) { check(node, node.source && node.source.value); },
          ExportNamedDeclaration(node) { if (node.source) check(node, node.source.value); },
          ExportAllDeclaration(node) { if (node.source) check(node, node.source.value); },
          ImportExpression(node) {
            if (node.source && node.source.type === 'Literal') check(node, node.source.value);
          },
        };
      },
    },

    // ── Contract-enforcement rules ──────────────────────────────────────────────
    // Source: AUTOMATED_ARCHITECTURE_ENFORCEMENT_CONTRACT.md + Architecture/03-layer-contracts.md
    // Wired as warnings first (enforcement philosophy: start as warn, graduate to error once clean).

    /** Forbid importing the Supabase client outside DAL / resolver / adapter layers — Layer Contract §2 */
    'no-supabase-outside-dal': {
      meta: {
        type: 'problem',
        docs: { description: 'Supabase client may only be imported in DAL, resolver, or adapter files; never in model/controller/hook/component/screen layers' },
        messages: { forbidden: 'Supabase client import is forbidden in the {{layer}} layer ({{src}}). Move database access into a DAL function.' },
      },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');

        // Layers that are allowed to touch Supabase (DAL, resolver, adapter, and the client modules themselves).
        const isAllowed =
          filename.includes('/dal/') || filename.endsWith('.dal.js') ||
          filename.includes('/resolvers/') || filename.endsWith('.resolver.js') ||
          filename.includes('/adapters/') || filename.includes('.adapter.') ||
          filename.includes('/services/supabase/');
        if (isAllowed) return {};

        // Only police recognised application layers; everything else is left alone.
        const layerOf = (f) => {
          if (f.includes('/controllers/') || f.includes('/controller/') || f.endsWith('.controller.js')) return 'controller';
          if (f.includes('/hooks/') || /\/use[A-Z][^/]*\.(js|jsx)$/.test(f)) return 'hook';
          if (f.includes('/model/') || f.includes('/models/') || f.endsWith('.model.js')) return 'model';
          if (/(Screen|View)\.(js|jsx)$/.test(f) || f.includes('/screens/')) return 'screen';
          if (f.includes('/components/')) return 'component';
          return null;
        };
        const layer = layerOf(filename);
        if (!layer) return {};

        const isSupabaseClient = (src) =>
          src === '@supabase/supabase-js' ||
          /\/services\/supabase\/(supabaseClient|vportClient|vcClient)/.test(src) ||
          /(^|\/)(supabaseClient|vportClient|vcClient)$/.test(src);

        return {
          ImportDeclaration(node) {
            const src = node.source && node.source.value;
            if (typeof src === 'string' && isSupabaseClient(src)) {
              context.report({ node, messageId: 'forbidden', data: { layer, src } });
            }
          },
        };
      },
    },

    /** Forbid DAL files importing layers above them — Layer Contract §2.1 (DAL Import Boundary) */
    'dal-no-upward-import': {
      meta: {
        type: 'problem',
        docs: { description: 'DAL files must not import model, controller, hook, component, screen, or adapter layers' },
        messages: { forbidden: 'DAL must not import the {{layer}} layer ({{src}}). DAL returns raw rows only.' },
      },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');
        if (!filename.includes('/dal/') && !filename.endsWith('.dal.js')) return {};

        const upward = [
          [/(\/model\/|\/models\/|\.model\.)/, 'model'],
          [/(\/controllers?\/|\.controller\.)/, 'controller'],
          [/(\/hooks\/|\/use[A-Z])/, 'hook'],
          [/\/components?\//, 'component'],
          [/(\/screens\/|Screen\.|View\.)/, 'screen'],
          [/(\.adapter\.|\/adapters\/)/, 'adapter'],
        ];

        const check = (node, src) => {
          if (typeof src !== 'string') return;
          for (const [re, layer] of upward) {
            if (re.test(src)) {
              context.report({ node, messageId: 'forbidden', data: { layer, src } });
              return;
            }
          }
        };

        return {
          ImportDeclaration(node) { check(node, node.source && node.source.value); },
          ExportNamedDeclaration(node) { if (node.source) check(node, node.source.value); },
          ExportAllDeclaration(node) { if (node.source) check(node, node.source.value); },
        };
      },
    },

    /** Forbid hooks importing DAL directly — Layer Contract §2.4 (hooks call controllers) */
    'hook-no-dal-import': {
      meta: {
        type: 'problem',
        docs: { description: 'Hooks must call controllers, not DAL functions directly' },
        messages: { forbidden: 'Hook imports DAL directly ({{src}}). Call a controller instead.' },
      },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');
        const isHook = filename.includes('/hooks/') || /\/use[A-Z][^/]*\.(js|jsx)$/.test(filename);
        if (!isHook) return {};

        return {
          ImportDeclaration(node) {
            const src = node.source && node.source.value;
            if (typeof src === 'string' && (src.includes('/dal/') || /\.dal(\.js)?$/.test(src))) {
              context.report({ node, messageId: 'forbidden', data: { src } });
            }
          },
        };
      },
    },

    /** Forbid feature index barrels re-exporting non-adapter internals — Adapter Contract §07 */
    'no-nonadapter-barrel-export': {
      meta: {
        type: 'problem',
        docs: { description: 'A feature index barrel may only re-export adapter surfaces, not deep internals' },
        messages: { forbidden: 'Feature index re-exports a non-adapter internal ({{src}}). Export only adapter surfaces (*.adapter.* or /adapters/) from a feature root.' },
      },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');
        const isFeatureBarrel = /\/features\/[^/]+\/index\.(js|jsx)$/.test(filename);
        if (!isFeatureBarrel) return {};

        const isAdapterSource = (src) => src.includes('.adapter') || src.includes('/adapters/');
        const check = (node, src) => {
          if (typeof src === 'string' && !isAdapterSource(src)) {
            context.report({ node, messageId: 'forbidden', data: { src } });
          }
        };

        return {
          ExportNamedDeclaration(node) { if (node.source) check(node, node.source.value); },
          ExportAllDeclaration(node) { if (node.source) check(node, node.source.value); },
        };
      },
    },

    /** Forbid deep ../../ relative import chains — use @/ aliases (CLAUDE.md / Dependency Rules §08) */
    'no-deep-relative-import': {
      meta: {
        type: 'problem',
        docs: { description: 'Cross-folder imports must use @/ path aliases, not ../../ relative chains' },
        messages: { forbidden: 'Deep relative import ({{src}}). Use an @/ path alias instead of a ../../ chain.' },
      },
      create(context) {
        const check = (node, src) => {
          if (typeof src === 'string' && /(^|\/)\.\.\/\.\.\//.test(src)) {
            context.report({ node, messageId: 'forbidden', data: { src } });
          }
        };

        return {
          ImportDeclaration(node) { check(node, node.source && node.source.value); },
          ExportNamedDeclaration(node) { if (node.source) check(node, node.source.value); },
          ExportAllDeclaration(node) { if (node.source) check(node, node.source.value); },
          ImportExpression(node) {
            if (node.source && node.source.type === 'Literal') check(node, node.source.value);
          },
        };
      },
    },
  },
};
