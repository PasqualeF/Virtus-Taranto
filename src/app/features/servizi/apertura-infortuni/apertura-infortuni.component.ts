import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-apertura-infortuni',
  templateUrl: './apertura-infortuni.component.html',
  styleUrls: ['./apertura-infortuni.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('600ms', style({ opacity: 1 })),
      ]),
    ]),
    trigger('slideInFromLeft', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
    ]),
  ],
})
export class AperturaInfortuniComponent implements OnInit {
  titolo = 'Apertura Pratiche Infortuni';
  descrizione = 'In caso di infortunio durante l\'attività sportiva, segui attentamente questa procedura per aprire la pratica di infortunio.';
  
  procedura = [
    'Entro 30 giorni dal verificarsi dell evento, l\'associazione deve inviare una segnalazione alla compagnia assicurativa convenzionata FIP. Il contratto è disponibile nella sezione Assicurazioni ("assicurazioni FIP")',
    'Passaggi per chi esercita la patria potestà sul minore. Inviare una mail a: virtustaranto@libero.it per squadre maschili . support_o@libero.it per squadre femminili . La mail deve contenere nome e cognome dell infortunato',
    'L associazione risponderà inviando: Un prestampato da compilare a cura del genitore. Un modulo sulla privacy da firmare.',
    'Entrambi i documenti devono essere compilati e restituiti via mail all associazione',
    'Una volta completata la segnalazione, l\'assicurazione invierà alla società il modulo di apertura sinistri.',
    'Il modulo di apertura sinistri contiene un protocollo che deve essere custodito. Da questo momento, tutte le ulteriori azioni verranno gestite direttamente tra il genitore e l\'assicurazione',
    'Si raccomanda di prendere visione della convenzione FIP per conoscere i dettagli specifici'
  ];

  moduloFipUrl = 'https://www.fip.aon.it/home';

  convenzioneTitolo = 'Convenzione Assicurativa Erredi assicurazioni';
  convenzioneDescrizione = 'Convenzione assicurazione a favore circuito Support_o';
  vantaggiConvenzione = [
    'RCA: 10% di sconto sull’ultima quietanza pagata con attestato di rischio con minimo tre annualità e senza alcun sinistro, tale offerta è riservata all’associato e al nucleo familiare.',
    'Polizza COVID (il prodotto garantisce un consulto medico telefonico immediato nel momento in cui si avverte un sintomo, un servizio di telemedicina e invio di un medico al domicilio o ambulanza, consegna farmaco ecc…ecc…) premio per individuo 74€ annui, premio per nucleo familiare 146€(max 5 persone)',
    'Polizza Abitazione garanzia catastrofali (bomba d’acqua, terremoto, alluvione) premio minimo 60€.',
    'Consulenza gratuita sulla previdenza complementare.',
    'Conto corrente Widiba (zero spese per il primo anno e gratuito dal secondo anno in poi se si canalizza stipendio o pensione).'
  ];

  ngOnInit() {
    // Inizializzazione se necessaria
  }

  scaricaModuloFip() {
    window.open(this.moduloFipUrl, '_blank');
  }
}