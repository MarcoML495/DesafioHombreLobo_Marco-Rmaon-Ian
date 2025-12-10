// notifications.ts - Sistema de notificaciones personalizado

/**
 * Tipos de notificación
 */
type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Opciones de notificación
 */
interface NotificationOptions {
  title?: string;
  message: string;
  type?: NotificationType;
  duration?: number; // en milisegundos, 0 = no auto-cierra
}

/**
 * Opciones de confirmación
 */
interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

/**
 * Contenedor de notificaciones
 */
let notificationContainer: HTMLElement | null = null;

/**
 * Inicializar el contenedor de notificaciones
 */
function initNotificationContainer(): HTMLElement {
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.className = 'notification-container';
    document.body.appendChild(notificationContainer);
  }
  return notificationContainer;
}

/**
 * Obtener icono según el tipo
 */
function getIcon(type: NotificationType): string {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  return icons[type] || icons.info;
}

/**
 * Mostrar notificación
 */
export function showNotification(options: NotificationOptions): void {
  const container = initNotificationContainer();
  
  const {
    title,
    message,
    type = 'info',
    duration = 5000
  } = options;

  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  notification.innerHTML = `
    <div class="notification-icon">${getIcon(type)}</div>
    <div class="notification-content">
      ${title ? `<div class="notification-title">${title}</div>` : ''}
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close" aria-label="Cerrar">×</button>
  `;

  // Añadir al contenedor
  container.appendChild(notification);

  // Botón cerrar
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn?.addEventListener('click', () => {
    closeNotification(notification);
  });

  // Auto-cerrar si duration > 0
  if (duration > 0) {
    setTimeout(() => {
      closeNotification(notification);
    }, duration);
  }
}

/**
 * Cerrar notificación con animación
 */
function closeNotification(notification: HTMLElement): void {
  notification.classList.add('hiding');
  setTimeout(() => {
    notification.remove();
  }, 300);
}

/**
 * Atajos para tipos de notificación
 */
export function notifySuccess(message: string, title?: string): void {
  showNotification({ message, title, type: 'success' });
}

export function notifyError(message: string, title?: string): void {
  showNotification({ message, title, type: 'error', duration: 7000 });
}

export function notifyWarning(message: string, title?: string): void {
  showNotification({ message, title, type: 'warning', duration: 6000 });
}

export function notifyInfo(message: string, title?: string): void {
  showNotification({ message, title, type: 'info' });
}

/**
 * Modal de confirmación personalizado
 */
export function showConfirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const {
      title = '¿Estás seguro?',
      message,
      confirmText = 'Confirmar',
      cancelText = 'Cancelar',
      type = 'warning'
    } = options;

    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'confirm-modal-overlay';
    
    const iconEmoji = type === 'danger' ? '⚠️' : type === 'warning' ? '⚠️' : 'ℹ️';
    
    overlay.innerHTML = `
      <div class="confirm-modal">
        <div class="confirm-modal-icon ${type}">${iconEmoji}</div>
        <h2 class="confirm-modal-title">${title}</h2>
        <p class="confirm-modal-message">${message}</p>
        <div class="confirm-modal-buttons">
          <button class="confirm-btn-cancel">${cancelText}</button>
          <button class="confirm-btn-confirm ${type === 'danger' ? 'danger' : ''}">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Mostrar con animación
    setTimeout(() => {
      overlay.classList.add('active');
    }, 10);

    // Handlers
    const confirmBtn = overlay.querySelector('.confirm-btn-confirm');
    const cancelBtn = overlay.querySelector('.confirm-btn-cancel');

    const close = (result: boolean) => {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 200);
    };

    confirmBtn?.addEventListener('click', () => close(true));
    cancelBtn?.addEventListener('click', () => close(false));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(false);
    });

    // ESC para cancelar
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close(false);
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  });
}

/**
 * Reemplazos para alert() y confirm() nativos
 */
export function alert(message: string): void {
  notifyInfo(message);
}

export function confirm(message: string): Promise<boolean> {
  return showConfirm({ message });
}

/**
 * Modal de victoria
 */
interface VictoryOptions {
  winner: 'wolves' | 'villagers';
  alivePlayers: Array<{id: number, name: string, role: string}>;
  onClose?: () => void;
}

export function showVictoryModal(options: VictoryOptions): void {
  const { winner, alivePlayers, onClose } = options;
  
  const overlay = document.createElement('div');
  overlay.className = 'game-modal-overlay victory-modal';
  
  const isWolves = winner === 'wolves';
  const title = isWolves ? '🐺 Victoria de los Lobos' : '👥 Victoria de los Aldeanos';
  const message = isWolves 
    ? 'Los lobos han diezmado a los aldeanos...' 
    : '¡Los aldeanos han eliminado a todos los lobos!';
  
  overlay.innerHTML = `
    <div class="game-modal-content">
      <div class="game-modal-header">
        <h2>${title}</h2>
      </div>
      <div class="game-modal-body">
        <p class="victory-message">${message}</p>
        <div class="survivors-list">
          <h3>Supervivientes:</h3>
          ${alivePlayers.map(p => `
            <div class="survivor-item">
              <img src="/rol_${p.role.toLowerCase()}.png" class="survivor-img" onerror="this.src='/rol_oculto.png'">
              <span>${p.name} - ${p.role}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="game-modal-footer">
        <button class="btn btn-primary victory-close-btn">Volver al menú</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 10);
  
  const closeBtn = overlay.querySelector('.victory-close-btn');
  closeBtn?.addEventListener('click', () => {
    if (onClose) onClose();
    else window.location.href = '../views/menuprincipal.html';
  });
}

/**
 * Modal de muerte
 */
interface DeathOptions {
  playerName: string;
  phase: 'day' | 'night';
  duration?: number;
}

export function showDeathModal(options: DeathOptions): void {
  const { playerName, phase, duration = 4000 } = options;
  
  const overlay = document.createElement('div');
  overlay.className = 'game-modal-overlay death-modal';
  
  let message: string;
  if (phase === 'disconnect') {
    message = `${playerName} se ha desconectado...`;
  } else if (phase === 'night') {
    message = `${playerName} fue devorado por los lobos durante la noche...`;
  } else {
    message = `${playerName} fue eliminado por votación del pueblo`;
  }
  
  overlay.innerHTML = `
    <div class="game-modal-content death-announcement">
      <div class="game-modal-body">
        <div class="death-icon">💀</div>
        <h2>¡Alguien ha muerto!</h2>
        <p class="death-message">${message}</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 10);
  
  setTimeout(() => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 500);
  }, duration);
}