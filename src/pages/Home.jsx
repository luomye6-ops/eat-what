import { useState } from 'react'
import { Link } from 'react-router-dom'
import RecipeCard from '../components/RecipeCard.jsx'
import recipes from '../data/recipes.js'

function shuffleRecipes(recipeList) {
  return [...recipeList].sort(() => Math.random() - 0.5)
}

function getRandomRecipes(previousRecommendedIds = []) {
  // 先过滤掉上一轮已经展示过的菜，尽量让“换一换”出现新内容。
  const freshRecipes = recipes.filter(
    (recipe) => !previousRecommendedIds.includes(recipe.id),
  )

  // 如果可选菜谱不足 3 道，就允许重复使用全部菜谱，避免页面推荐不够。
  const candidateRecipes = freshRecipes.length >= 3 ? freshRecipes : recipes

  return shuffleRecipes(candidateRecipes).slice(0, 3)
}

// 首页展示今日随机推荐菜品，点击按钮可以重新生成推荐。
function Home() {
  const [recommendedRecipes, setRecommendedRecipes] = useState(() => getRandomRecipes())
  const [message, setMessage] = useState('')

  function handleRefresh() {
    const previousRecommendedIds = recommendedRecipes.map((recipe) => recipe.id)
    const nextRecipes = getRandomRecipes(previousRecommendedIds)

    setRecommendedRecipes(nextRecipes)
    setMessage('已为你换了一组推荐')
  }

  return (
    <section className="home-page">
      <div className="home-header">
        <div>
          <h2>今天吃啥</h2>
          <p>不知道吃什么？我来帮你选</p>
        </div>
        <button type="button" onClick={handleRefresh}>
          换一换
        </button>
      </div>

      {message && <p className="refresh-message">{message}</p>}

      <div className="recipe-list">
        {recommendedRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      <Link to="/favorites">进入我的收藏</Link>
    </section>
  )
}

export default Home
