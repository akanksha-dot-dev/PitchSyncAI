/* ============================================================
   FIFA MatchDay GenAI Nexus — Chat Component
   GenAI chat interface for Fan Copilot mode
   ============================================================ */

import { h, $, mount, formatTime, uid, debounce } from '../utils/dom.js';
import { announce } from '../utils/a11y.js';
import { sanitizeHTML, validateMessage } from '../utils/validators.js';
import state, { subscribe } from '../core/state.js';
import { emit } from '../core/events.js';
import { processMessage } from '../services/genai-engine.js';
import { QUICK_REPLIES } from '../utils/constants.js';

/**
 * Create the chat interface
 * @returns {HTMLElement}
 */
export function createChat() {
  const container = h('div', { class: 'chat-container', id: 'chat-container', role: 'region', 'aria-label': 'AI Chat Assistant' },

    // Chat Header
    h('div', { class: 'chat-header' },
      h('div', { class: 'chat-header__title' },
        h('div', { class: 'chat-header__avatar', 'aria-hidden': 'true' }, '🤖'),
        h('div', {},
          h('h2', { class: 'text-sm font-bold text-slate-800' }, 'MatchDay AI Assistant'),
          h('p', { class: 'text-xs text-slate-500' }, 'Powered by GenAI • Always ready to help'),
        ),
      ),
      h('div', { class: 'flex items-center gap-2' },
        h('span', { class: 'badge badge--success' },
          h('span', { class: 'status-dot status-dot--online', 'aria-hidden': 'true' }),
          'Online',
        ),
      ),
    ),

    // Messages Area
    h('div', { class: 'chat-messages', id: 'chat-messages', role: 'log', 'aria-live': 'polite', 'aria-label': 'Chat messages' }),

    // Quick Replies
    h('div', { class: 'quick-replies', id: 'quick-replies', role: 'group', 'aria-label': 'Quick reply suggestions' }),

    // Input Area
    h('div', { class: 'chat-input-area' },
      h('textarea', {
        id: 'chat-input',
        class: 'chat-input',
        placeholder: 'Ask me about navigation, transit, food, accessibility...',
        rows: '1',
        'aria-label': 'Type your message',
        onKeydown: handleInputKeydown,
        onInput: autoResizeInput,
      }),
      h('button', {
        id: 'chat-send-btn',
        class: 'chat-send-btn',
        'aria-label': 'Send message',
        onClick: handleSend,
      }, h('span', { 'aria-hidden': 'true' }, '➤')),
    ),
  );

  // Initialize with welcome message and quick replies
  setTimeout(() => {
    addWelcomeMessage();
    updateQuickReplies();
  }, 300);

  // Subscribe to language changes to update quick replies
  subscribe('language', () => updateQuickReplies());

  return container;
}

/**
 * Add the welcome message to chat
 */
function addWelcomeMessage() {
  const welcomeMsg = {
    id: uid('msg'),
    role: 'ai',
    text: "Welcome to MetLife Stadium! 🏟️ I'm your AI matchday assistant. I can help you with:\n\n🗺️ **Navigation** — Find your seat, food, restrooms\n🚇 **Transit** — Real-time departure schedules\n♿ **Accessibility** — Wheelchair routes, low-sensory paths\n🌐 **Language** — I speak 10 languages!\n\nHow can I help you today?",
    timestamp: Date.now(),
    type: 'text',
  };

  state.chatHistory = [...state.chatHistory, welcomeMsg];
  renderMessage(welcomeMsg);
}

/**
 * Render a single message in the chat
 */
function renderMessage(msg) {
  const container = $('#chat-messages');
  if (!container) return;

  const isUser = msg.role === 'user';
  const messageEl = h('div', {
    class: `chat-message chat-message--${isUser ? 'user' : 'ai'}`,
    id: msg.id,
  },
    h('div', {
      class: 'chat-message__avatar',
      'aria-hidden': 'true',
    }, isUser ? '👤' : '🤖'),
    h('div', {},
      h('div', { class: 'chat-message__bubble' },
        ...renderMessageContent(msg),
      ),
      h('span', { class: 'chat-message__time' }, formatTime(msg.timestamp)),
    ),
  );

  container.appendChild(messageEl);
  scrollToBottom();
}

/**
 * Render rich message content (text, routes, transit, tickets)
 */
function renderMessageContent(msg) {
  const elements = [];

  // Render markdown-like text
  if (msg.text) {
    const textEl = h('div', { innerHTML: formatMarkdown(msg.text) });
    elements.push(textEl);
  }

  // Rich data rendering
  if (msg.richData) {
    switch (msg.richData.type) {
      case 'route':
        elements.push(renderRouteCard(msg.richData));
        break;
      case 'transit':
        elements.push(renderTransitEmbed(msg.richData));
        break;
      case 'ticket':
        elements.push(renderTicketEmbed(msg.richData));
        break;
    }
  }

  return elements;
}

/**
 * Render a route card inside a chat message
 */
function renderRouteCard(data) {
  const card = h('div', { class: 'rich-card' },
    h('div', { class: 'rich-card__header' },
      h('span', { class: 'rich-card__icon' }, '🗺️'),
      data.accessible ? 'Accessible Route' : 'Recommended Route',
    ),
    ...data.steps.map(step =>
      h('div', { class: 'route-step' },
        h('span', { class: 'route-step__number' }, step.step),
        h('div', {},
          h('p', { class: 'font-medium' }, step.instruction),
          h('p', { class: 'text-slate-500 mt-0.5' }, `${step.distance} • ${step.time}`),
        ),
      ),
    ),
  );
  return card;
}

/**
 * Render transit schedule inside a chat message
 */
function renderTransitEmbed(data) {
  const card = h('div', { class: 'rich-card' },
    h('div', { class: 'rich-card__header' },
      h('span', { class: 'rich-card__icon' }, '🚇'),
      'Upcoming Departures',
    ),
    ...data.schedules.map(s => {
      const depTime = new Date(s.departure);
      const diffMin = Math.max(0, Math.round((depTime - new Date()) / 60000));
      const modeIcons = { metro: '🚇', bus: '🚌', shuttle: '🚐', rideshare: '🚗' };

      return h('div', { class: 'route-step' },
        h('span', { class: 'text-base', 'aria-hidden': 'true' }, modeIcons[s.mode] || '🚌'),
        h('div', { class: 'flex-1' },
          h('p', { class: 'font-medium text-xs' }, `${s.line}`),
          h('p', { class: 'text-slate-500 text-xs' }, s.destination),
        ),
        h('div', { class: 'text-right' },
          h('span', { class: `text-xs font-bold ${diffMin <= 3 ? 'text-red-600' : 'text-slate-700'}` },
            diffMin === 0 ? 'Now' : `${diffMin}m`,
          ),
          s.delay > 0 ? h('span', { class: 'badge badge--warning ml-1 text-xs' }, `+${s.delay}m`) : null,
        ),
      );
    }),
  );
  return card;
}

/**
 * Render ticket info inside a chat message
 */
function renderTicketEmbed(data) {
  const t = data.ticket;
  return h('div', { class: 'rich-card border-l-4 border-l-fifa-gold' },
    h('div', { class: 'rich-card__header' },
      h('span', { class: 'rich-card__icon' }, '🎟️'),
      t.competition,
    ),
    h('div', { class: 'mt-2 space-y-1' },
      h('p', { class: 'text-base font-bold text-slate-800' }, t.match),
      h('p', { class: 'text-xs text-slate-600' }, `${t.venue} • ${t.date} at ${t.time}`),
      h('div', { class: 'flex gap-4 mt-2 pt-2 border-t border-surface-200' },
        h('div', {},
          h('span', { class: 'text-xs text-slate-500' }, 'Gate'),
          h('p', { class: 'font-bold' }, t.gate),
        ),
        h('div', {},
          h('span', { class: 'text-xs text-slate-500' }, 'Section'),
          h('p', { class: 'font-bold' }, t.section),
        ),
        h('div', {},
          h('span', { class: 'text-xs text-slate-500' }, 'Row'),
          h('p', { class: 'font-bold' }, t.row),
        ),
        h('div', {},
          h('span', { class: 'text-xs text-slate-500' }, 'Seat'),
          h('p', { class: 'font-bold' }, t.seat),
        ),
      ),
      h('div', { class: 'mt-2 pt-2 border-t border-surface-200 text-center' },
        h('div', { class: 'inline-block bg-slate-900 text-white px-4 py-1.5 rounded font-mono text-xs tracking-wider' }, t.barcode),
      ),
    ),
  );
}

/**
 * Simple markdown-like formatting
 */
function formatMarkdown(text) {
  return sanitizeHTML(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/• /g, '&bull; ');
}

/**
 * Handle keyboard input in the chat
 */
function handleInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

/**
 * Auto-resize textarea
 */
function autoResizeInput(e) {
  const el = e.target;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

/**
 * Handle sending a message
 */
async function handleSend() {
  const input = $('#chat-input');
  if (!input) return;

  const text = input.value.trim();
  const validation = validateMessage(text);
  if (!validation.valid) return;

  // Clear input
  input.value = '';
  input.style.height = 'auto';

  // Add user message
  const userMsg = {
    id: uid('msg'),
    role: 'user',
    text,
    timestamp: Date.now(),
  };
  state.chatHistory = [...state.chatHistory, userMsg];
  renderMessage(userMsg);

  // Show typing indicator
  showTypingIndicator();
  state.isTyping = true;

  try {
    // Process through GenAI engine
    const response = await processMessage(text, state.language, state.chatHistory, state.userProfile);

    // Remove typing indicator
    hideTypingIndicator();
    state.isTyping = false;

    // Add AI response
    const aiMsg = {
      id: uid('msg'),
      role: 'ai',
      text: response.text,
      richData: response.richData,
      timestamp: Date.now(),
      intent: response.intent,
      confidence: response.confidence,
      type: response.type,
    };
    state.chatHistory = [...state.chatHistory, aiMsg];
    renderMessage(aiMsg);
    announce('New response from AI assistant');

  } catch (err) {
    hideTypingIndicator();
    state.isTyping = false;
    console.error('[Chat] Error:', err);

    const errorMsg = {
      id: uid('msg'),
      role: 'ai',
      text: "I'm sorry, I encountered an error processing your request. Please try again.",
      timestamp: Date.now(),
      type: 'error',
    };
    state.chatHistory = [...state.chatHistory, errorMsg];
    renderMessage(errorMsg);
  }
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
  const container = $('#chat-messages');
  if (!container || $('#typing-indicator')) return;

  const indicator = h('div', { class: 'chat-message chat-message--ai', id: 'typing-indicator' },
    h('div', { class: 'chat-message__avatar', 'aria-hidden': 'true' }, '🤖'),
    h('div', { class: 'typing-indicator', role: 'status', 'aria-label': 'AI is typing' },
      h('div', { class: 'typing-indicator__dot' }),
      h('div', { class: 'typing-indicator__dot' }),
      h('div', { class: 'typing-indicator__dot' }),
    ),
  );

  container.appendChild(indicator);
  scrollToBottom();
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
  const indicator = $('#typing-indicator');
  if (indicator) indicator.remove();
}

/**
 * Scroll chat to bottom
 */
function scrollToBottom() {
  const container = $('#chat-messages');
  if (container) {
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }
}

/**
 * Update quick reply suggestions
 */
function updateQuickReplies() {
  const container = $('#quick-replies');
  if (!container) return;

  container.innerHTML = '';
  const replies = QUICK_REPLIES[state.language] || QUICK_REPLIES.en;

  for (const reply of replies) {
    const btn = h('button', {
      class: 'quick-reply',
      'aria-label': `Quick reply: ${reply}`,
      onClick: () => {
        const input = $('#chat-input');
        if (input) {
          input.value = reply;
          handleSend();
        }
      },
    }, reply);
    container.appendChild(btn);
  }
}

/**
 * Send a quick reply programmatically
 * @param {string} text
 */
export function sendQuickReply(text) {
  const input = $('#chat-input');
  if (input) {
    input.value = text;
    handleSend();
  }
}

export default { createChat, sendQuickReply };
