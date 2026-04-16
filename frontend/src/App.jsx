import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Chat from "./Chat"
import './App.css'
import AddData from './AddData'

const App = () => {
  return(
    <div>
      <Chat />
      <AddData />
    </div>
  );
}

export default App
