import { useState } from 'react'
import { Link } from 'react-router-dom'
import RecipeCard from '../components/RecipeCard.jsx'
import recipes from '../data/recipes.js'
import { getFavorites } from '../utils/storage.js'

// 收藏页根据收藏 id 找到对应菜谱，再复用 RecipeCard 展示。
function Favorites() {
  const [favoriteIds, setFavoriteIds] = useState(() => getFavorites())

  // 收藏状态变化后重新读取 id，保证取消收藏后列表立即更新。
  function handleFavoriteChange() {
    setFavoriteIds(getFavorites())
  }

  const favoriteRecipes = favoriteIds
    .map((id) => recipes.find((recipe) => recipe.id === id))
    .filter(Boolean)

  if (favoriteRecipes.length === 0) {
    return (
      <section className="favorites-page empty-state">
        <h2>我的收藏</h2>
        <p>你还没有收藏任何菜谱</p>
        <Link className="back-home-link" to="/">
          去首页看看
        </Link>
      </section>
    )
  }

  return (
    <section className="favorites-page">
      <div className="favorites-header">
        <h2>我的收藏</h2>
        <Link to="/">返回首页</Link>
      </div>

      <div className="recipe-list">
        {favoriteRecipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onFavoriteChange={handleFavoriteChange}
          />
        ))}
      </div>
    </section>
  )
}

export default Favorites
