import { CategoryFilter } from "./components/CategoryFilter"
import { Hero } from "./components/Hero"
import Navbar from "./components/Navbar"

const App = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <CategoryFilter />
    </div>
  )
}

export default App
