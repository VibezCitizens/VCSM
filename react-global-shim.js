// Make React available as window.React for any UMD/minified libs
import * as React from 'react';

if (!window.React) {
  window.React = React;
}
