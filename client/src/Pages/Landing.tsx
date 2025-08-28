import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import './Landing.css';

import corte1 from "../Images/corte1.jpeg";
import corte2 from "../Images/corte2.jpeg";
import color from "../Images/color.jpeg";
import principal from "../Images/principal.jpeg";

const Landing: React.FC = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header" data-aos="fade-down">
        <div className="landing-header-text">
          <h1>Bienvenido a <span>Tende Corte</span></h1>
          <p>
           ¡Bienvenido a tende corte!

En nuestro salón nos especializamos en brindarte el mejor servicio, un corte perfecto y una experiencia única. Con profesionales apasionados por su trabajo, tu estilo y comodidad son nuestra prioridad.

¡Nos vemos pronto para un corte que te hará destacar!
          </p>
          <div className="buttons">
            <Link to="/register" className="button-primary">Registrarse</Link>
            <Link to="/login" className="button-secondary">Iniciar sesión</Link>
          </div>
        </div>
        <img src={principal} alt="Peluquería Tende Corte" data-aos="fade-left" />
      </header>

      {/* Sección de cortes */}
      <section className="landing-section">
        <div className="card" data-aos="fade-up">
          <img src={corte1} alt="Corte clásico" />
          <h3>Mullet</h3>
        </div>
        <div className="card" data-aos="fade-up" data-aos-delay="200">
          <img src={color} alt="Corte moderno" />
          <h3>Global Fantasy</h3>
        </div>
        <div className="card" data-aos="fade-up" data-aos-delay="400">
          <img src={corte2} alt="Corte juvenil" />
          <h3>Taper Fade</h3>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2025 Tende Corte. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Landing;
