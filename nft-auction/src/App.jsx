import {Routes, Route} from 'react-router-dom';
import Navbar from './components/navbar';
import Mint from './components/mint';
import Inventory from './components/inventory';
import Home from './components/home';
function App() {

  return (
    <>
    <Navbar/>
       <Routes>
       <Route path = "/" element = {<Home/>}/>
       <Route path = "/mint" element = {<Mint/>}/>
       <Route path = "/inventory" element = {<Inventory/>}/>
       </Routes>
    </>
  )
}

export default App
