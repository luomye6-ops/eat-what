import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import recipes from '../data/recipes.js'
import { isFavoriteRecipe, toggleFavoriteRecipe } from '../utils/storage.js'

// 菜谱详情页，根据地址栏中的 id 找到对应菜谱并展示详情。
function RecipeDetail() {
  const { id } = useParams()

  // useParams 拿到的 id 是字符串，这里先转成数字再和菜谱 id 比较。
  const recipeId = Number(id)
  const recipe = recipes.find((item) => item.id === recipeId)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    setIsFavorite(isFavoriteRecipe(recipeId))
  }, [recipeId])

  function handleFavoriteClick() {
    if (!recipe) {
      return
    }

    const nextIsFavorite = toggleFavoriteRecipe(recipe)
    setIsFavorite(nextIsFavorite)
  }

  if (!recipe) {
    return (
      <section className="recipe-detail">
        <h2>没有找到这个菜谱</h2>
        <Link className="back-home-link" to="/">
          返回首页
        </Link>
      </section>
    )
  }

  return (
    <section className="recipe-detail">
      <Link className="back-home-link" to="/">
        返回首页
      </Link>

      <img className="recipe-detail-image" src={recipe.image} alt={recipe.name} />

      <div className="recipe-detail-title">
        <h2>{recipe.name}</h2>
        <button type="button" onClick={handleFavoriteClick}>
          {isFavorite ? '已收藏' : '收藏'}
        </button>
      </div>

      <div className="recipe-detail-info">
        <p>用时：{recipe.time}</p>
        <p>难度：{recipe.difficulty}</p>
        <p>适合人数：{recipe.servings}</p>
        <p>口味：{recipe.taste}</p>
        <p>分类：{recipe.category}</p>
      </div>

      <div className="recipe-detail-section">
        <h3>食材</h3>
        <ul>
          {recipe.ingredients.map((ingredient) => (
            <li key={ingredient}>{ingredient}</li>
          ))}
        </ul>
      </div>

      <div className="recipe-detail-section">
        <h3>做法步骤</h3>
        <ol>
          {recipe.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="recipe-detail-section">
        <h3>小贴士</h3>
        <p>{recipe.tips}</p>
      </div>
    </section>
  )
}

export default RecipeDetail
