import { VisitorTracking, type VisitorData, type UTMParameters, type ReferrerInfo } from './visitorTracking';

export interface CustomUIEvent {
  element_type: string;
  element_label: string;
  element_id?: string;
  click_x?: number;
  click_y?: number;
  form_data?: Record<string, any>;
}

export class EnhancedTracker {
  private static isListening = false;

  static setupUIEventTracking(trackFunction: (eventName: string, eventData: any) => void): void {
    if (this.isListening) return;
    this.isListening = true;

    // Track Start Here button clicks
    this.trackButtonClicks('start-here', 'Start Here Button', trackFunction);
    
    // Track contact chip clicks
    this.trackChipClicks(trackFunction);
    
    // Track form interactions
    this.trackFormInteractions(trackFunction);
    
    // Track footer link clicks
    this.trackFooterLinks(trackFunction);
    
    // Track navigation clicks
    this.trackNavigationClicks(trackFunction);
  }

  private static trackButtonClicks(
    buttonId: string, 
    buttonLabel: string, 
    trackFunction: (eventName: string, eventData: any) => void
  ): void {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener('click', (event) => {
        const customEvent: CustomUIEvent = {
          element_type: 'button',
          element_label: buttonLabel,
          element_id: buttonId,
          click_x: (event as MouseEvent).clientX,
          click_y: (event as MouseEvent).clientY
        };
        
        trackFunction('ui_interaction', {
          action: 'button_click',
          ...customEvent
        });
      });
    }
  }

  private static trackChipClicks(trackFunction: (eventName: string, eventData: any) => void): void {
    // Track contact method chips
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const chip = target.closest('[data-contact-chip]');
      
      if (chip) {
        const chipType = chip.getAttribute('data-contact-chip');
        const customEvent: CustomUIEvent = {
          element_type: 'chip',
          element_label: `Contact Chip: ${chipType}`,
          element_id: chipType || undefined,
          click_x: event.clientX,
          click_y: event.clientY
        };
        
        trackFunction('ui_interaction', {
          action: 'contact_chip_click',
          contact_method: chipType,
          ...customEvent
        });
      }
    });
  }

  private static trackFormInteractions(trackFunction: (eventName: string, eventData: any) => void): void {
    // Track typing in message input
    const messageInput = document.querySelector('textarea[placeholder*=\\\"message\\\"], input[placeholder*=\\\"message\\\"]') as HTMLInputElement;
    if (messageInput) {
      let typingTimer: NodeJS.Timeout;
      
      messageInput.addEventListener('input', () => {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
          trackFunction('ui_interaction', {
            action: 'message_typing',
            element_type: 'textarea',
            element_label: 'Message Input',
            message_length: messageInput.value.length
          });
        }, 1000); // Track after 1 second of no typing
      });
    }

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);
      const formObject = Object.fromEntries(formData.entries());
      
      trackFunction('form_interaction', {
        action: 'form_submit',
        form_id: form.id || 'unknown',
        form_data: {
          ...formObject,
          // Remove sensitive data but keep structure info
          name: formObject.name ? '[PROVIDED]' : '[EMPTY]',
          email: formObject.email ? '[PROVIDED]' : '[EMPTY]',
          message: formObject.message ? `[${(formObject.message as string).length} chars]` : '[EMPTY]'
        }
      });
    });

    // Track form validation errors
    document.addEventListener('invalid', (event) => {
      const input = event.target as HTMLInputElement;
      trackFunction('form_interaction', {
        action: 'validation_error',
        field_name: input.name || input.id,
        field_type: input.type,
        validation_message: input.validationMessage
      });
    });
  }

  private static trackFooterLinks(trackFunction: (eventName: string, eventData: any) => void): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('footer a, [data-footer-link]') as HTMLAnchorElement;
      
      if (link) {
        const linkText = link.textContent?.trim() || link.getAttribute('aria-label') || 'Unknown Link';
        const linkHref = link.href || link.getAttribute('href') || '';
        
        trackFunction('ui_interaction', {
          action: 'footer_link_click',
          element_type: 'link',
          element_label: linkText,
          link_url: linkHref,
          link_type: this.categorizeLinkType(linkHref),
          click_x: event.clientX,
          click_y: event.clientY
        });
      }
    });
  }

  private static trackNavigationClicks(trackFunction: (eventName: string, eventData: any) => void): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const navLink = target.closest('nav a, [data-nav-link]') as HTMLAnchorElement;
      
      if (navLink) {
        const linkText = navLink.textContent?.trim() || 'Navigation Link';
        const linkHref = navLink.href || navLink.getAttribute('href') || '';
        
        trackFunction('navigation', {
          action: 'nav_click',
          element_type: 'nav_link',
          element_label: linkText,
          link_url: linkHref,
          is_external: linkHref.startsWith('http') && !linkHref.includes(window.location.hostname),
          click_x: event.clientX,
          click_y: event.clientY
        });
      }
    });
  }

  private static categorizeLinkType(href: string): string {
    if (href.startsWith('mailto:')) return 'email';
    if (href.startsWith('tel:')) return 'phone';
    if (href.includes('linkedin.com')) return 'linkedin';
    if (href.includes('github.com')) return 'github';
    if (href.includes('twitter.com')) return 'twitter';
    if (href.endsWith('.pdf')) return 'pdf';
    if (href.startsWith('http')) return 'external';
    return 'internal';
  }

  static getEnhancedSessionData(): {
    visitorData: VisitorData;
    utmParams: UTMParameters;
    referrerInfo: ReferrerInfo;
    isInternal: boolean;
  } {
    return {
      visitorData: VisitorTracking.getOrCreateVisitorData(),
      utmParams: VisitorTracking.parseUTMParameters(),
      referrerInfo: VisitorTracking.analyzeReferrer(),
      isInternal: VisitorTracking.detectInternalTraffic()
    };
  }
}
