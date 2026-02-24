import './Header.css'
import logo from './assets/logo.png' 

function Header() {
  return (
    <header>
        <div className="header">      
            <img src={ logo } alt="Logo" className="logo" />
            <h1>Capricorn Adventures</h1>
        </div>
    </header>
  );
}

export default Header;