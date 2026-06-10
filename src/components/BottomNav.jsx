import { NavLink } from 'react-router-dom'

// 底部导航组件，提供首页和我的收藏两个入口。
function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/">首页</NavLink>
      <NavLink to="/favorites">我的收藏</NavLink>
    </nav>
  )
}

export default BottomNav
