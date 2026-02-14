import './styles/index.css';
import { defineCustomElement as defineIonApp } from '@ionic/core/components/ion-app.js';
import { defineCustomElement as defineIonContent } from '@ionic/core/components/ion-content.js';
import { defineCustomElement as defineIonHeader } from '@ionic/core/components/ion-header.js';
import { defineCustomElement as defineIonToolbar } from '@ionic/core/components/ion-toolbar.js';
import { defineCustomElement as defineIonTitle } from '@ionic/core/components/ion-title.js';
import { defineCustomElement as defineIonButtons } from '@ionic/core/components/ion-buttons.js';
import { defineCustomElement as defineIonButton } from '@ionic/core/components/ion-button.js';
import { defineCustomElement as defineIonIcon } from '@ionic/core/components/ion-icon.js';
import { defineCustomElement as defineIonInput } from '@ionic/core/components/ion-input.js';
import { defineCustomElement as defineIonSearchbar } from '@ionic/core/components/ion-searchbar.js';
import { defineCustomElement as defineIonModal } from '@ionic/core/components/ion-modal.js';
import { defineCustomElement as defineIonSegment } from '@ionic/core/components/ion-segment.js';
import { defineCustomElement as defineIonSegmentButton } from '@ionic/core/components/ion-segment-button.js';
import { defineCustomElement as defineIonLabel } from '@ionic/core/components/ion-label.js';
import { defineCustomElement as defineIonToggle } from '@ionic/core/components/ion-toggle.js';

// Icons
import { addIcons } from 'ionicons';
import {
  settingsOutline,
  search,
  mapOutline,
  heart,
  heartOutline,
  compass,
  locate,
  arrowUp,
  arrowDown,
  water,
  waterOutline,
  eyeOutline,
  speedometerOutline,
  thermometerOutline,
  sunnyOutline,
  flowerOutline,
  trashOutline,
  chevronForward,
  closeOutline,
  notifications,
  trash,
  cloudyNight,
  colorPalette,
  arrowBack,
  navigate,
  locationOutline
} from 'ionicons/icons';

import theme from './utils/theme.js';
import App from './App.js';

// Initialize Ionic components
defineIonApp();
defineIonContent();
defineIonHeader();
defineIonToolbar();
defineIonTitle();
defineIonButtons();
defineIonButton();
defineIonIcon();
defineIonInput();
defineIonSearchbar();
defineIonModal();
defineIonSegment();
defineIonSegmentButton();
defineIonLabel();
defineIonToggle();

// Register Icons Globally
addIcons({
  'settings-outline': settingsOutline,
  'search': search,
  'map-outline': mapOutline,
  'heart': heart,
  'heart-outline': heartOutline,
  'compass': compass,
  'locate': locate,
  'arrow-up': arrowUp,
  'arrow-down': arrowDown,
  'water': water,
  'water-outline': waterOutline,
  'eye-outline': eyeOutline,
  'speedometer-outline': speedometerOutline,
  'thermometer-outline': thermometerOutline,
  'sunny-outline': sunnyOutline,
  'flower-outline': flowerOutline,
  'trash-outline': trashOutline,
  'chevron-forward': chevronForward,
  'close-outline': closeOutline,
  'notifications': notifications,
  'trash': trash,
  'cloudy-night': cloudyNight,
  'color-palette': colorPalette,
  'arrow-back': arrowBack,
  'navigate': navigate,
  'location-outline': locationOutline,
});

// Initialize theme
theme.init();

// Initialize app
const app = new App();
app.init();

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  });
}

// Network status monitoring
window.addEventListener('online', () => {
  document.querySelector('.offline-badge')?.remove();
  console.log('Back online');
});

window.addEventListener('offline', () => {
  if (!document.querySelector('.offline-badge')) {
    const badge = document.createElement('div');
    badge.className = 'offline-badge';
    badge.textContent = '📡 Offline Mode';
    document.body.appendChild(badge);
  }
});
