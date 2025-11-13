import '../style.css'


document.querySelector<HTMLDivElement>('#app')!.innerHTML= `
<div class="header">
    <ul>
      <li><a href="#intro">Intro</a></li>
      <li><a href="#roles">Roles</a></li>
      <li><a href="registrar.html">Registrarse</a></li>
    </ul>
  </div>

  <div class="login-container">
    <div class="logo-large">
      <img src="logo_juego.png" alt="logo">
    </div>
    <p class="subtitle-login">Juego de estrategia y deduccion social</p>

    <div class="login-form" id="intro">
      <span>
        <p>En lo mas profundo del campo, la aldea de Castronegro
          ha sido invadida recientemente por Hombres Lobo.</p>
        <p>Cada noche, aldeanos que se transforman en Hombres Lobo
          cometen asesinatos para cenar carne humana.</p>
        <p>Es la hora de hacerse con el control y eliminar este mal,
          antes de que la aldea pierda sus ultimos habitantes.</p>
      </span><br>

      <span>
        <p>"Los Lobos de Castronegro" es un juego de deduccion social que enfrentará a aldeanos y Hombres Lobo,
          que deben matar a todos los miembros del equipo contrario.</p><br>
        <p>Cada dia, los aldeanos realizarán una votacion para discutir a quien sospechan de ser un Hombre Lobo,
          y esta sera su forma de eliminarlos... si sus sospechas son acertadas.</p><br>
        <p>Cada noche, los Hombres Lobo elegirán a un aldeano que matar, y dependiendo del tipo de personas
          que habitan la aldea, podrian ocurrir muchos mas sucesos que cambiarán el curso del juego.</p><br>
      </span><br>


    </div>
    <h1>Lista de roles</h1>
  </div>
  <div class="lista-roles" id="roles">
    <div class="rol lobo">
      <h1>🐺 Hombre Lobo</h1>
      <img src="rol_lobo.png" alt="Hombre Lobo" class="carta-rol">
      <p>Cada noche: Los Hombres Lobo eligen un aldeano que matar. Ganan cuando su numero excede al de los aldeanos.</p>
    </div>

    <div class="rol aldea">
      <h1>🧑‍🌾 Aldeano</h1>
      <img src="rol_aldeano.png" alt="Aldeano" class="carta-rol">
      <p>Ninguna habilidad especial. El bando de los aldeanos gana cuando todos los Hombres Lobo son eliminados.</p>
    </div>

    <div class="rol aldea">
      <h1>🧑‍🌾 Vidente</h1>
      <img src="rol_vidente.png" alt="Vidente" class="carta-rol">
      <p>Cada noche: Puede seleccionar un jugador y ver su rol.</p>
    </div>

    <div class="rol aldea">
      <h1>🧑‍🌾 Cazador</h1>
      <img src="rol_cazador.png" alt="Cazador" class="carta-rol">
      <p>Al morir: Mata a otro jugador de su eleccion.</p>
    </div>

    <div class="rol aldea">
      <h1>🧑‍🌾 Cupido</h1>
      <img src="rol_cupido.png" alt="Cupido" class="carta-rol">
      <p>En la primera noche: Selecciona dos jugadores para que se enamoren, tambien pudiendo elegirse a si mismo.
        Si un enamorado muere, su pareja tambien morirá.
      </p><br>
      <p>
        CASO ESPECIAL: Si la pareja consiste de un Hombre Lobo y un aldeano, tendrán que eliminar al resto de jugadores
        para ganar.
      </p>
    </div>

    <div class="rol aldea">
      <h1>🧑‍🌾 Bruja</h1>
      <img src="rol_bruja.png" alt="Bruja" class="carta-rol">
      <p>Cada noche: Puede usar dos pociones, una para resucitar a la victima de los Hombres Lobo, y otra para matar a
        un jugador de su eleccion.
        Cada pocion solo se puede usar una vez por partida.
      </p>
    </div>

    <div class="rol aldea">
      <h1>🧑‍🌾 Niña</h1>
      <img src="rol_niña.png" alt="Niña" class="carta-rol">
      <p>Cada noche: Puede abrir el chat del bando de los Hombres Lobo. Sin embargo, cada vez que lo haga, tiene una
        probabilidad
        de ser descubierta, apareciendo como conectada.
      </p>
    </div>

    <div class="rol aldea">
      <h1>🧑‍🌾 Ladrón</h1>
      <img src="rol_ladron.png" alt="Ladrón" class="carta-rol">
      <p>En la primera noche: Puede seleccionar un jugador para intercambiar roles. Durante el resto de la partida,
        actuará como un Aldeano Común.</p>
    </div>

    <div class="rol neutro">
      <h1>Alcalde</h1>
      <img src="rol_alcalde.png" alt="Alcalde" class="carta-rol">
      <p>En vez de ser repartido al principio del juego, este rol se decide entre los jugadores por voto popular.</p>
      <br>
      <p>Al votar: Sus votos valdrán el doble.</p><br>
      <p>Al morir: Puede elegir otro jugador para que herede el rol.</p><br>
    </div>
  </div>

  <div class="wolf-illustration">Pito</div>
`

