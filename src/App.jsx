import Header from './components/Header.jsx'
import BottomNav from './components/BottomNav.jsx'
import Home from './pages/Home.jsx'

// 应用根组件。后续接入 React Router 后，可以在这里配置页面路由。
function App() {
  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <Home />
      </main>
      <BottomNav />
    </div>
  )
}

export default App
