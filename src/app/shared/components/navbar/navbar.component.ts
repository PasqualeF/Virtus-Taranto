import { Component, ElementRef, HostListener, Renderer2, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

interface SubMenuItem {
  name: string;
  route?: string;
}

interface SportCategory {
  label: string;
  items: SubMenuItem[];
}

interface NavItem {
  label: string;
  route?: string;
  submenuItems: (string | SubMenuItem | SportCategory)[];
  isOpen?: boolean;
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  activeSubmenu: string | null = null;
  private lastScrollTop = 0;
  private readonly SCROLL_THRESHOLD = 50;
  isMobileMenuOpen = false;
  isNavbarVisible = true;
  submenuTimer: any = null;
  isTransparent = true;
  
  // Variabili per schermata sottomenu
  activeSubmenuScreen = false;
  activeSubmenuScreenTitle = '';
  activeSubmenuScreenData: NavItem | null = null;
  
  // Variabili per sottomenu annidati
  activeNestedMenuScreen = false;
  activeNestedMenuTitle = '';
  activeNestedMenuItems: SubMenuItem[] | null = null;
  
  private routerSubscription: Subscription;

  constructor(
    private renderer: Renderer2, 
    private el: ElementRef,
    private router: Router
  ) {
    // Ascolta i cambi di route per chiudere la sidebar
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.closeMobileMenu();
      }
    });
  }

  // Array di elementi di navigazione - uguale all'originale
  navItems: NavItem[] = [
    { 
      label: 'News', 
      submenuItems: [
        {
          label: '',
          items: [
            { name: 'Orari Allenamenti', route: '/news/orari-allenamenti' },
            { name: 'Ultimissime', route: '/news/ultimissime' },
            { name: 'Comunicazioni', route: '/news/comunicazioni' }
          ]
        },
      ] 
    },
    { 
      label: 'Media', 
      submenuItems: [
        {
          label: '',
          items: [
            { name: 'Foto', route: '/media/foto' },
            { name: 'Video', route: '/news/ultimissime' }
          ]
        },
      ] 
    },
    {      
      label: 'Squadre', 
      submenuItems: [
        {
          label: 'Basket',
          items: [
            { name: 'Under 19  gold', route: '/squadra/basket/Under 19  gold' },
            { name: 'Under 19  silver', route: '/squadra/basket/Under 19  silver' },
            { name: 'Under 17  ecc', route: '/squadra/basket/Under 17  ecc' },
            { name: 'Under 17  gold', route: '/squadra/basket/Under 17  gold' },
            { name: 'Under 15  ecc', route: '/squadra/basket/Under 15  ecc' },
            { name: 'Under 15  silver', route: '/squadra/basket/Under 15  silver' },
            { name: 'Under 14  gold', route: '/squadra/basket/Under 14  gold' },
            { name: 'Under 13  gold', route: '/squadra/basket/Under 13  gold' }
          ]
        },
        {
          label: 'Volley',
          items: [
            { name: 'Under 18', route: '/squadra/volley/under-18' },
            { name: 'Under 16', route: '/squadra/volley/under-16' }
          ]
        },
        {
          label: 'Mini',
          items: [
            { name: 'Minibasket', route: '/squadra/mini/minibasket' },
            { name: 'Minivolley', route: '/squadra/mini/minivolley' }
          ]
        }
      ]
    },
    { 
      label: 'Who Else?', 
      submenuItems: [
        {
          label: '',
          items: [
            { name: 'Storia', route: '/who-else/storia' },
            { name: 'Partner', route: '/who-else/partner' },
            { name: 'Palestre', route: '/who-else/palestre' },
            { name: 'Organigramma', route: '/who-else/organigramma' },
            { name: 'Contatti', route: '/who-else/contatti'},
          ]
        },
      ] 
    },
    { 
      label: 'Store', 
      submenuItems: [
        {
          label: '',
          items: [
            { name: 'Next-Gen Style', route: '/shop' },
            { name: 'Game Day Essentials', route: '/servizi/visitaMedica' },
            { name: 'Urban lifeStyle', route: '/servizi/iscrizioni' }
          ]
        },
      ] 
    },
    { 
      label: 'Eventi', 
      submenuItems: [
        {
          label: '',
          items: [
            { name: 'Tornei', route: '/eventi/tornei' },
            { name: 'Eventi Speciali', route: '/eventi/eventiSpeciali' },
            { name: 'Calendario', route: '/eventi/calendario' }
          ]
        },
      ] 
    },
    { 
      label: 'Servizi', 
      submenuItems: [
        {
          label: '',
          items: [
            { name: 'Consulenza Legale e Assicurativa', route: '/servizi/assicurazione' },
            { name: 'Procedura visita medica', route: '/servizi/visitaMedica' },
            { name: 'Iscrizione Giovanili', route: '/servizi/iscrizioni' },
            { name: 'Modelli Organizzativi e codice etico', route: '/servizi/codiceEtico' }
          ]
        },
      ] 
    }
  ];

  ngOnInit() {
    // Inizializza lo stato dei menu
    this.navItems = this.navItems.map(item => ({
      ...item,
      isOpen: false
    }));

    // Aggiunge listener per tasti
    this.setupKeyboardNavigation();
  }

  ngOnDestroy() {
    // Pulizia risorse
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    this.renderer.removeClass(document.body, 'mobile-menu-open');
  }

  // Aggiunge listener per tasti
  private setupKeyboardNavigation() {
    this.renderer.listen('window', 'keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (this.activeNestedMenuScreen) {
          this.closeNestedMenuScreen();
        } else if (this.activeSubmenuScreen) {
          this.closeSubmenuScreen();
        } else if (this.isMobileMenuOpen) {
          this.closeMobileMenu();
        }
      }
    });
  }

  // METODI ORIGINALI PER IL DESKTOP
  showSubmenu(submenu: string) {
    if (this.submenuTimer) {
      clearTimeout(this.submenuTimer);
      this.submenuTimer = null;
    }
    this.activeSubmenu = submenu;
  }

  hideSubmenu() {
    this.submenuTimer = setTimeout(() => {
      const submenuElement = document.querySelector('.submenu:hover');
      const navItemElement = document.querySelector('.nav-item:hover');
      
      if (!submenuElement && !navItemElement) {
        this.activeSubmenu = null;
      }
    }, 100);
  }

  onSubmenuMouseEnter(submenu: string) {
    if (this.submenuTimer) {
      clearTimeout(this.submenuTimer);
      this.submenuTimer = null;
    }
    this.activeSubmenu = submenu;
  }

  onSubmenuMouseLeave(event: MouseEvent) {
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!relatedTarget?.closest('.nav-item')) {
      this.hideSubmenu();
    }
  }

  isComplexSubmenuItem(item: any): item is { name: string; route: string } {
    return typeof item === 'object' && 'name' in item && 'route' in item;
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    this.isTransparent = false;
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.isTransparent = true;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (currentScrollTop > this.lastScrollTop) {
      // Scrolling down
      this.isNavbarVisible = false;
    } else {
      // Scrolling up
      this.isNavbarVisible = true;
    }

    this.lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
  }
  
  isSportCategory(item: any): item is SportCategory {
    return item !== null && 
    typeof item === 'object' && 
    'label' in item && 
    typeof item.label === 'string' &&
    'items' in item && 
    Array.isArray(item.items);
  }

  // METODI PER MENU MOBILE
  hasSubmenuItems(item: NavItem): boolean {
    return item.submenuItems && item.submenuItems.length > 0;
  }

  // Apre il menu mobile
  openMobileMenu() {
    this.isMobileMenuOpen = true;
    this.renderer.addClass(document.body, 'mobile-menu-open');
  }

  // Chiude il menu mobile e tutti i sottomenu
  closeMobileMenu() {
    this.closeNestedMenuScreen();
    this.closeSubmenuScreen();
    this.isMobileMenuOpen = false;
    this.renderer.removeClass(document.body, 'mobile-menu-open');
  }

  // Apre la schermata del sottomenu
  openSubmenuScreen(item: NavItem) {
    this.activeSubmenuScreenTitle = item.label;
    this.activeSubmenuScreenData = item;
    this.activeSubmenuScreen = true;
  }

  // Chiude la schermata del sottomenu
  closeSubmenuScreen() {
    this.closeNestedMenuScreen();
    this.activeSubmenuScreen = false;
    setTimeout(() => {
      this.activeSubmenuScreenData = null;
      this.activeSubmenuScreenTitle = '';
    }, 300);
  }

  // Apre un sottomenu annidato
  openNestedMenu(title: string, items: SubMenuItem[]) {
    this.activeNestedMenuTitle = title;
    this.activeNestedMenuItems = items;
    this.activeNestedMenuScreen = true;
  }

  // Chiude il sottomenu annidato
  closeNestedMenuScreen() {
    this.activeNestedMenuScreen = false;
    setTimeout(() => {
      this.activeNestedMenuItems = null;
      this.activeNestedMenuTitle = '';
    }, 300);
  }

  // Gestisce il tasto back del browser
  @HostListener('window:popstate', ['$event'])
  onPopState(event: any) {
    if (this.activeNestedMenuScreen) {
      event.preventDefault();
      this.closeNestedMenuScreen();
      return;
    }
    
    if (this.activeSubmenuScreen) {
      event.preventDefault();
      this.closeSubmenuScreen();
      return;
    }
    
    if (this.isMobileMenuOpen) {
      event.preventDefault();
      this.closeMobileMenu();
    }
  }
}