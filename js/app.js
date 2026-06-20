/**
 * APPLICATION ENTRY POINT
 * Initializes the state database, setups DOM listeners, and conducts the initial layout paint.
 */

import { initBoardState } from './state.js?v=1.7';
import { initDOM, renderBoard, renderFiltersAndSelectors } from './dom.js?v=1.7';

// Define global render execution flow
function render() {
  renderBoard(render);
}

// Conduct startup setups when DOM content is ready
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize data store
  initBoardState();

  // 2. Setup all modals, inputs, slider listeners
  initDOM(render);

  // 3. Populate filters dropdown
  renderFiltersAndSelectors();

  // 4. Paint board UI canvas
  render();
  
  console.log('AuraFlow Glassmorphic Kanban Board successfully initialized.');
});
