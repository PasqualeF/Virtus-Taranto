import { Component, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';



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
  isOpen?: boolean;  // Aggiunta questa proprietà
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  activeSubmenu: string | null = null;
  private lastScrollTop = 0;
  private readonly SCROLL_THRESHOLD = 50;
  isSidebarOpen = false;
  isNavbarVisible = true;
  submenuTimer: any = null;



  constructor(private renderer: Renderer2, 
    private el: ElementRef,
    private router: Router) {
// Ascolta i cambi di route per chiudere la sidebar
this.router.events.subscribe((event) => {
if (event instanceof NavigationEnd) {
this.closeSidebar();
}
});
}
  navItems: NavItem[] = [
    { label: 'News', 
      submenuItems: [
        {
          label: '',
          items: [
            { name: 'Orari Allenamenti', route: '/news/orari-allenamenti' },
            { name: 'Ultimissime', route: '/news/ultimissime' },
            { name: 'Social news', route: '/news/social' },
            { name: 'Comunicazioni', route: '/news/comunicazioni' }
          ]
        },
        ] },
    { label: 'Media', 
      submenuItems: [
        {
          label: '',
          items: [
            { name: 'Foto', route: '/news/orari-allenamenti' },
            { name: 'Video', route: '/news/ultimissime' }
          ]
        },
        ] },
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
          }]
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
    { label: 'Store', submenuItems: [
      
      {
        label: '',
        items: [
          { name: 'Next-Gen Style', route: '/shop' },
          { name: 'Game Day Essentials', route: '/servizi/visitaMedica' },
          { name: 'Urban lifeStyle', route: '/servizi/iscrizioni' }
          ]
      },
    ] },
    { label: 'Eventi', submenuItems: [
      {
        label: '',
        items: [
          { name: 'Tornei', route: '/eventi/tornei' },
          { name: 'Eventi Speciali', route: '/eventi/eventiSpeciali' },
          { name: 'Calendario', route: '/eventi/calendario' }
                ]
      },
   
    ] },
    { label: 'Servizi', submenuItems: [
      {
        label: '',
        items: [
          { name: 'Consulenza Legale e Assicurativa', route: '/servizi/assicurazione' },
          { name: 'Procedura visita medica', route: '/servizi/visitaMedica' },
          { name: 'Iscrizione Giovanili', route: '/servizi/iscrizioni' },
          { name: 'Modelli Organizzativi e codice etico', route: '/servizi/codiceEtico' }
        ]
      },
    ] }
  ];


  ngOnInit() {
    // Inizializza tutti i navItems con isOpen a false
    this.navItems = this.navItems.map(item => ({
      ...item,
      isOpen: false
    }));
  }


  showSubmenu(submenu: string) {
    // Clear any existing timer
    if (this.submenuTimer) {
      clearTimeout(this.submenuTimer);
      this.submenuTimer = null;
    }
    this.activeSubmenu = submenu;
  }

  hideSubmenu() {
    // Add a delay before hiding the submenu
    this.submenuTimer = setTimeout(() => {
      // Check if the mouse is still over the submenu
      const submenuElement = document.querySelector('.submenu:hover');
      const navItemElement = document.querySelector('.nav-item:hover');
      
      if (!submenuElement && !navItemElement) {
        this.activeSubmenu = null;
      }
    }, 100); // 100ms delay
  }
 // Aggiungi questo metodo per gestire il mouse che entra nel submenu
 onSubmenuMouseEnter(submenu: string) {
  if (this.submenuTimer) {
    clearTimeout(this.submenuTimer);
    this.submenuTimer = null;
  }
  this.activeSubmenu = submenu;
}

// Aggiungi questo metodo per gestire il mouse che esce dal submenu
onSubmenuMouseLeave(event: MouseEvent) {
  const relatedTarget = event.relatedTarget as HTMLElement;
  if (!relatedTarget?.closest('.nav-item')) {
    this.hideSubmenu();
  }
}
  isComplexSubmenuItem(item: any): item is { name: string; route: string } {
    return typeof item === 'object' && 'name' in item && 'route' in item;
  }

  isTransparent = true;

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

    this.lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop; // For Mobile or negative scrolling
  }
  
  isSportCategory(item: any): item is SportCategory {
    return item !== null && 
    typeof item === 'object' && 
    'label' in item && 
    typeof item.label === 'string' &&
    'items' in item && 
    Array.isArray(item.items);
  }



  toggleMobileSubmenu(event: Event, item: NavItem) {
    event.preventDefault();
    event.stopPropagation();
    
    // Chiudi tutti gli altri submenu
    this.navItems.forEach(navItem => {
      if (navItem !== item) {
        navItem.isOpen = false;
      }
    });
    
    item.isOpen = !item.isOpen;
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    
    if (this.isSidebarOpen) {
      this.renderer.addClass(document.body, 'sidebar-open');
      // Aggiunge event listener per chiudere con ESC
      this.renderer.listen('window', 'keydown', (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          this.closeSidebar();
        }
      });
    } else {
      this.closeSidebar();
    }
  }

  closeSidebar() {
    this.isSidebarOpen = false;
    this.renderer.removeClass(document.body, 'sidebar-open');
    // Chiudi tutti i submenu
    this.navItems.forEach(item => item.isOpen = false);
  }


}