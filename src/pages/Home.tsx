import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="home">
      <div className="home__brillo home__brillo--uno" aria-hidden="true" />
      <div className="home__brillo home__brillo--dos" aria-hidden="true" />

      <main className="home__contenido">
        <p className="home__eyebrow">CUMPLEAÑOS</p>
        <h1 className="home__nombre">LUIS</h1>
        <span className="home__edad" aria-label="18 años">
          18
        </span>
        <p className="home__frase">Una noche para celebrar los 18.</p>
        <p className="home__subtitulo">Crea tu invitación y presenta tu código QR al llegar.</p>

        <div className="home__acciones">
          <Link to="/invitado" className="btn btn--primario">
            CREAR MI QR
          </Link>
          <Link to="/guardia/login" className="btn btn--fantasma">
            SOY GUARDIA
          </Link>
        </div>
      </main>

      <footer className="home__pie">Luis · 18 años</footer>
    </div>
  )
}