import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isFavoriteRecipe, toggleFavoriteRecipe } from '../utils/storage.js'

// 菜谱卡片组件，只负责展示菜谱信息、收藏按钮和详情页入口。
function RecipeCard({ recipe, onFavoriteChange }) {
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (recipe) {
      setIsFavorite(isFavoriteRecipe(recipe.id))
    }
  }, [recipe])

  if (!recipe) {
    return null
  }

  function handleFavoriteClick() {
    const nextIsFavorite = toggleFavoriteRecipe(recipe)
    setIsFavorite(nextIsFavorite)

    if (onFavoriteChange) {
      onFavoriteChange(recipe.id, nextIsFavorite)
    }
  }

  return (
    <article className="recipe-card">
      <img src={recipe.image} alt={recipe.name} />

      <div className="recipe-card-content">
        <h3>{recipe.name}</h3>
        <p>用时：{recipe.time}</p>
        <p>难度：{recipe.difficulty}</p>
        <p>口味：{recipe.taste}</p>
        {recipe.nutrition && (
          <p className="nutrition-summary">
            {recipe.nutrition.kcal} kcal · 蛋白质 {recipe.nutrition.protein}g
          </p>
        )}

        <div className="recipe-card-actions">
          <button type="button" onClick={handleFavoriteClick}>
            {isFavorite ? '已收藏' : '收藏'}
          </button>
          <Link className="recipe-card-link" to={`/recipe/${recipe.id}`}>
            查看做法
          </Link>
        </div>
      </div>
    </article>
  )
}

export default RecipeCard
