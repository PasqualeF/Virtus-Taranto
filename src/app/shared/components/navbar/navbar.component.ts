import { Component, ElementRef, HostListener, Renderer2, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SquadNavigationService } from 'src/app/core/service/squad-navigation.service';

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
  private squadsSubscription: Subscription | null = null;

  // Array di elementi di navigazione
  navItems: NavItem[] = [];

  constructor(
    private renderer: Renderer2, 
    private el: ElementRef,
    private router: Router,
    private squadNavigationService: SquadNavigationService
  ) {
    // Ascolta i cambi di route per chiudere la sidebar
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.closeMobileMenu();
      }
    });
  }

  ngOnInit() {
    // Inizializza il menu con i dati statici
    this.initializeStaticMenu();
    
    // Carica le squadre da Strapi
    this.loadSquadsFromStrapi();
    
    // Aggiunge listener per tasti
    this.setupKeyboardNavigation();
  }

  ngOnDestroy() {
    // Pulizia risorse
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.squadsSubscription) {
      this.squadsSubscription.unsubscribe();
    }
    this.renderer.removeClass(document.body, 'mobile-menu-open');
  }

  private initializeStaticMenu() {
    this.navItems = [
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
              { name: 'Media', route: '/media/foto' },
            ]
          },
        ] 
      },
      {      
        label: 'Squadre', 
        submenuItems: [] // Sarà popolato dinamicamente
      },
      { 
        label: 'Who Else?', 
        submenuItems: [
          {
            label: '',
            items: [
              { name: 'Storia', route: '/who-else/storia' },
              { name: 'Achivements', route: '/who-else/achivements'},
              { name: 'Partner', route: '/who-else/partner' },
              { name: 'Palestre', route: '/who-else/palestre' },
              { name: 'Organigramma', route: '/who-else/organigramma' },
              { name: 'Contatti', route: '/who-else/contatti'}
              
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
              { name: 'Shop', route: '/shop' }
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
              { name: 'Modelli Organizzativi e codice etico', route: '/servizi/codiceEtico' },
              { name: 'Prenota un campo', route: '/servizi/book' } 
            ]
          },
        ] 
      }
    ];

    // Inizializza lo stato dei menu
    this.navItems = this.navItems.map(item => ({
      ...item,
      isOpen: false
    }));
  }

  private loadSquadsFromStrapi() {
    this.squadsSubscription = this.squadNavigationService.getSquadsForNavigation()
      .subscribe({
        next: (sportCategories) => {
          // Trova l'indice del menu Squadre
          const squadreIndex = this.navItems.findIndex(item => item.label === 'Squadre');
          
          if (squadreIndex !== -1) {
            // Aggiorna il submenu con i dati da Strapi
            this.navItems[squadreIndex].submenuItems = sportCategories;
          }
        },
        error: (error) => {
          console.error('Errore nel caricamento delle squadre:', error);
          // In caso di errore, usa i dati di fallback
          this.setFallbackSquads();
        }
      });
  }

  private setFallbackSquads() {
    const squadreIndex = this.navItems.findIndex(item => item.label === 'Squadre');
    
    if (squadreIndex !== -1) {
      this.navItems[squadreIndex].submenuItems = [
        {
          label: 'Basket',
          items: [
            { name: 'Under 19', route: '/squadra/basket/Under%2019' },
            { name: 'Under 17', route: '/squadra/basket/Under%2017' }
          ]
        },
        {
          label: 'Volley',
          items: [
            { name: 'Under 18', route: '/squadra/volley/Under%2018' }
          ]
        },
        {
          label: 'Mini',
          items: [
            { name: 'Minibasket', route: '/squadra/mini/minibasket' }
          ]
        }
      ];
    }
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