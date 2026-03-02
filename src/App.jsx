import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Header from './Header'
import Auth from './Auth'


function App() {


  return (
    <Router>
      <div className="hero">
        <Header />
        <Routes>
          <Route path="/" element={
            /* Main Landing Page content can go here in the future if needed, 
               for now the Header is always visible */
            <div />
          } />
          <Route path="/signin" element={<Auth mode="signin" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

