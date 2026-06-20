/**
 * DRAG & DROP API MANAGEMENT MODULE
 * Integrates HTML5 drag & drop for cards sorting and column reordering.
 */

import { moveTask, reorderColumns, getBoardState } from './state.js?v=1.7';

let draggedCardId = null;
let draggedSourceColumnId = null;
let draggedColumnId = null;
let placeholder = null;

// Create visual drag indicator placeholder card
function getOrCreatePlaceholder() {
  if (!placeholder) {
    placeholder = document.createElement('div');
    placeholder.className = 'drag-placeholder';
  }
  return placeholder;
}

// Helper to determine the insert-after task card element based on mouse Y
function getCardInsertPosition(columnTaskList, mouseY) {
  const cardElements = [...columnTaskList.querySelectorAll('.task-card:not(.dragging)')];

  return cardElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = mouseY - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Helper to determine the insert-after column based on mouse X
function getColumnInsertPosition(canvas, mouseX) {
  const colElements = [...canvas.querySelectorAll('.board-column:not(.dragging)')];

  return colElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = mouseX - box.left - box.width / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * Setup listeners on a task card
 */
export function setupCardDragListeners(cardElement, taskId, columnId) {
  cardElement.addEventListener('dragstart', (e) => {
    draggedCardId = taskId;
    draggedSourceColumnId = columnId;
    draggedColumnId = null; // Reset column drag tracking
    
    // Smooth delay for visual effect
    setTimeout(() => {
      cardElement.classList.add('dragging');
    }, 0);
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  });

  cardElement.addEventListener('dragend', () => {
    cardElement.classList.remove('dragging');
    if (placeholder && placeholder.parentNode) {
      placeholder.parentNode.removeChild(placeholder);
    }
    draggedCardId = null;
    draggedSourceColumnId = null;
    
    // Remove highlights on all columns
    document.querySelectorAll('.task-list').forEach(list => {
      list.classList.remove('drag-over');
    });
  });
}

/**
 * Setup listeners on a column (both header for dragging column, and task-list for cards dropping)
 */
export function setupColumnDragListeners(columnElement, columnId, onStateChanged) {
  const header = columnElement.querySelector('.column-header');
  const taskList = columnElement.querySelector('.task-list');
  const canvas = document.getElementById('boardCanvas');

  // 1. Column reordering via header dragging
  header.addEventListener('dragstart', (e) => {
    // Check if dragging cards inside headers (shouldn't happen, but safe check)
    if (draggedCardId) {
      e.preventDefault();
      return;
    }
    
    draggedColumnId = columnId;
    setTimeout(() => {
      columnElement.classList.add('dragging');
    }, 0);
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/column', columnId);
  });

  header.addEventListener('dragend', () => {
    columnElement.classList.remove('dragging');
    draggedColumnId = null;
  });

  // 2. Drag over column area (handling card placement within this list)
  taskList.addEventListener('dragover', (e) => {
    if (draggedCardId) {
      e.preventDefault();
      const afterElement = getCardInsertPosition(taskList, e.clientY);
      const visualPlaceholder = getOrCreatePlaceholder();
      
      if (afterElement) {
        taskList.insertBefore(visualPlaceholder, afterElement);
      } else {
        taskList.appendChild(visualPlaceholder);
      }
    }
  });

  taskList.addEventListener('dragenter', (e) => {
    if (draggedCardId) {
      e.preventDefault();
      taskList.classList.add('drag-over');
    }
  });

  taskList.addEventListener('dragleave', () => {
    taskList.classList.remove('drag-over');
  });

  taskList.addEventListener('drop', (e) => {
    if (draggedCardId) {
      e.preventDefault();
      taskList.classList.remove('drag-over');

      // Find drop index
      const cardsInCol = [...taskList.querySelectorAll('.task-card:not(.dragging)')];
      const visualPlaceholder = getOrCreatePlaceholder();
      const dropIndex = cardsInCol.indexOf(visualPlaceholder);

      // Mutate state
      moveTask(draggedCardId, draggedSourceColumnId, columnId, dropIndex);
      
      // Cleanup placeholder
      if (visualPlaceholder.parentNode) {
        visualPlaceholder.parentNode.removeChild(visualPlaceholder);
      }

      onStateChanged();
    }
  });

  // 3. Canvas listening to column dragging to reorder columns
  columnElement.addEventListener('dragover', (e) => {
    if (draggedColumnId && draggedColumnId !== columnId) {
      e.preventDefault();
    }
  });

  columnElement.addEventListener('drop', (e) => {
    if (draggedColumnId && draggedColumnId !== columnId) {
      e.preventDefault();
      
      const state = getBoardState();
      const sourceColIdx = state.columns.findIndex(c => c.id === draggedColumnId);
      const targetColIdx = state.columns.findIndex(c => c.id === columnId);

      if (sourceColIdx !== -1 && targetColIdx !== -1) {
        reorderColumns(sourceColIdx, targetColIdx);
        onStateChanged();
      }
    }
  });
}
