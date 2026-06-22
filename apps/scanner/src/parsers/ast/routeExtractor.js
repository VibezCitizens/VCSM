import { propertyName, stringValue, walkAst } from "./parser.js";

export function extractRoutesFromAst(ast) {
  const routes = [];

  walkAst(ast, (node, ancestors) => {
    if (node.type === "JSXElement" && jsxName(node.openingElement?.name) === "Route") {
      const route = jsxAttributeValue(node.openingElement.attributes, "path");
      if (route) routes.push(routeEntry(route, "react-router-jsx", node, ancestors, jsxAttributeElement(node.openingElement.attributes, "element")));
    }

    if (node.type === "ObjectProperty" || node.type === "ObjectMethod") {
      if (propertyName(node.key) !== "path") return;
      const route = stringValue(node.value);
      if (route) routes.push(routeEntry(route, "route-object", node, ancestors, routeObjectElement(ancestors)));
    }
  });

  return dedupe(routes);
}

function routeEntry(route, source, node, ancestors, elementName = null) {
  const protectedRoute = ancestors.some((ancestor) => JSON.stringify(minimalNode(ancestor)).includes("ProtectedRoute"));
  return {
    route,
    routeType: route.includes("*") ? "wildcard" : /[:\[]/.test(route) ? "dynamic" : "static",
    access: protectedRoute ? "protected" : "public",
    routeAccess: protectedRoute ? "protected" : "public",
    runtime: "web",
    elementName,
    source,
    confidence: "HIGH",
    evidence: ["route extracted from AST"]
  };
}

function jsxName(node) {
  if (!node) return null;
  if (node.type === "JSXIdentifier") return node.name;
  if (node.type === "JSXMemberExpression") return jsxName(node.property);
  return null;
}

function jsxAttributeValue(attributes, name) {
  const attr = attributes?.find((item) => item.type === "JSXAttribute" && item.name?.name === name);
  if (!attr) return null;
  if (attr.value?.type === "StringLiteral") return attr.value.value;
  if (attr.value?.type === "JSXExpressionContainer") return stringValue(attr.value.expression);
  return null;
}

function jsxAttributeElement(attributes, name) {
  const attr = attributes?.find((item) => item.type === "JSXAttribute" && item.name?.name === name);
  const expression = attr?.value?.type === "JSXExpressionContainer" ? attr.value.expression : null;
  if (expression?.type === "JSXElement") return jsxName(expression.openingElement?.name);
  if (expression?.type === "Identifier") return expression.name;
  return null;
}

function routeObjectElement(ancestors) {
  const objectExpression = [...ancestors].reverse().find((ancestor) => ancestor.type === "ObjectExpression");
  const elementProperty = objectExpression?.properties?.find((property) => propertyName(property.key) === "element");
  const value = elementProperty?.value;
  if (value?.type === "JSXElement") return jsxName(value.openingElement?.name);
  if (value?.type === "Identifier") return value.name;
  return null;
}

function minimalNode(node) {
  if (!node || typeof node !== "object") return node;
  if (node.type === "Identifier") return { type: node.type, name: node.name };
  if (node.type === "JSXIdentifier") return { type: node.type, name: node.name };
  if (node.type === "StringLiteral") return { type: node.type, value: node.value };
  return { type: node.type };
}

function dedupe(routes) {
  const seen = new Set();
  return routes.filter((route) => {
    const key = `${route.route}:${route.source}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
