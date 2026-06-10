import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import RecipeCard from '../components/RecipeCard.jsx'
import recipes from '../data/recipes.js'
import {
  getFavorites,
  getPreferences,
  getRecommendationHistory,
  savePreferences,
  saveTodayRecommendation,
} from '../utils/storage.js'

function shuffleRecipes(recipeList) {
  return [...recipeList].sort(() => Math.random() - 0.5)
}

function getRecipeMinutes(timeText) {
  return Number.parseInt(timeText, 10)
}

function getUniqueOptions(fieldName) {
  return [...new Set(recipes.map((recipe) => recipe[fieldName]))]
}

function parseIngredientText(text) {
  return text
    .split(/[\s,，、]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function getIngredientMatchCount(recipe, availableIngredients) {
  return availableIngredients.filter((ingredient) =>
    recipe.ingredients.some((item) => item.includes(ingredient)),
  ).length
}

function getHistoryCount(recipeId, history) {
  return history.reduce((count, item) => {
    if (!Array.isArray(item.recipeIds)) {
      return count
    }

    return count + item.recipeIds.filter((id) => id === recipeId).length
  }, 0)
}

function filterRecipes(preferences) {
  return recipes.filter((recipe) => {
    const recipeMinutes = getRecipeMinutes(recipe.time)
    const isHealthyRecipe =
      recipe.nutrition && recipe.nutrition.kcal <= 500 && recipe.nutrition.fat <= 25
    const hasDislikedIngredient = preferences.dislikedIngredients.some((ingredient) =>
      recipe.ingredients.some((item) => item.includes(ingredient)),
    )

    if (preferences.taste && recipe.taste !== preferences.taste) {
      return false
    }

    if (preferences.difficulty && recipe.difficulty !== preferences.difficulty) {
      return false
    }

    if (preferences.maxTime && recipeMinutes > Number(preferences.maxTime)) {
      return false
    }

    if (preferences.healthyMode && !isHealthyRecipe) {
      return false
    }

    return !hasDislikedIngredient
  })
}

function getRandomRecipes(preferences, previousRecommendedIds = []) {
  const filteredRecipes = filterRecipes(preferences)

  // 先排除上一轮出现过的菜；如果剩余数量不足 3 道，就在当前筛选结果中允许重复。
  const freshRecipes = filteredRecipes.filter(
    (recipe) => !previousRecommendedIds.includes(recipe.id),
  )
  const candidateRecipes = freshRecipes.length >= 3 ? freshRecipes : filteredRecipes

  return shuffleRecipes(candidateRecipes).slice(0, 3)
}

function getIngredientMatchedRecipes(availableIngredients, history) {
  if (availableIngredients.length === 0) {
    return []
  }

  const favoriteIds = getFavorites()

  return recipes
    .map((recipe) => {
      const matchCount = getIngredientMatchCount(recipe, availableIngredients)
      const favoriteScore = favoriteIds.includes(recipe.id) ? 100 : 0
      const historyScore = getHistoryCount(recipe.id, history) * 10

      return {
        recipe,
        matchCount,
        score: favoriteScore + historyScore + matchCount,
      }
    })
    .filter((item) => item.matchCount > 0)
    .sort((first, second) => second.score - first.score)
    .map((item) => item.recipe)
}

// 首页展示筛选、用户偏好、食材匹配、今日推荐和最近 7 天推荐历史。
function Home() {
  const [preferences, setPreferences] = useState(() => getPreferences())
  const [ingredientInput, setIngredientInput] = useState('')
  const [availableIngredientText, setAvailableIngredientText] = useState('')
  const [availableIngredients, setAvailableIngredients] = useState([])
  const [favoriteVersion, setFavoriteVersion] = useState(0)
  const [recommendedRecipes, setRecommendedRecipes] = useState(() =>
    getRandomRecipes(getPreferences()),
  )
  const [history, setHistory] = useState(() => getRecommendationHistory())
  const [message, setMessage] = useState('')

  const tasteOptions = useMemo(() => getUniqueOptions('taste'), [])
  const difficultyOptions = useMemo(() => getUniqueOptions('difficulty'), [])
  const matchedRecipes = useMemo(
    () => getIngredientMatchedRecipes(availableIngredients, history),
    [availableIngredients, history, favoriteVersion],
  )

  function updatePreferences(nextPreferences) {
    setPreferences(nextPreferences)
    savePreferences(nextPreferences)
  }

  function handleFilterChange(event) {
    const { checked, name, type, value } = event.target
    const nextPreferences = {
      ...preferences,
      [name]: type === 'checkbox' ? checked : value,
    }

    updatePreferences(nextPreferences)
  }

  function handleAddDislikedIngredient() {
    const ingredient = ingredientInput.trim()

    if (!ingredient || preferences.dislikedIngredients.includes(ingredient)) {
      setIngredientInput('')
      return
    }

    updatePreferences({
      ...preferences,
      dislikedIngredients: [...preferences.dislikedIngredients, ingredient],
    })
    setIngredientInput('')
  }

  function handleRemoveDislikedIngredient(ingredient) {
    updatePreferences({
      ...preferences,
      dislikedIngredients: preferences.dislikedIngredients.filter(
        (item) => item !== ingredient,
      ),
    })
  }

  function handleRefresh() {
    const previousRecommendedIds = recommendedRecipes.map((recipe) => recipe.id)
    const nextRecipes = getRandomRecipes(preferences, previousRecommendedIds)
    const nextRecipeIds = nextRecipes.map((recipe) => recipe.id)

    setRecommendedRecipes(nextRecipes)
    setHistory(saveTodayRecommendation(nextRecipeIds))
    setMessage(
      nextRecipes.length > 0
        ? '已为你换了一组推荐'
        : '当前条件下没有合适的菜谱',
    )
  }

  function handleApplyFilters() {
    const nextRecipes = getRandomRecipes(preferences)
    const nextRecipeIds = nextRecipes.map((recipe) => recipe.id)

    setRecommendedRecipes(nextRecipes)
    setHistory(saveTodayRecommendation(nextRecipeIds))
    setMessage(
      nextRecipes.length > 0
        ? '已按你的偏好更新推荐'
        : '当前条件下没有合适的菜谱',
    )
  }

  function handleMatchIngredients() {
    const nextAvailableIngredients = parseIngredientText(availableIngredientText)

    setAvailableIngredients(nextAvailableIngredients)
    setMessage(
      nextAvailableIngredients.length > 0
        ? '已根据现有食材生成推荐'
        : '请先输入至少一种食材',
    )
  }

  function handleFavoriteChange() {
    setFavoriteVersion((currentVersion) => currentVersion + 1)
  }

  const historyItems = history.map((item) => ({
    ...item,
    recipes: item.recipeIds
      .map((id) => recipes.find((recipe) => recipe.id === id))
      .filter(Boolean),
  }))

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

      <div className="filter-panel">
        <div className="filter-grid">
          <label>
            口味
            <select name="taste" value={preferences.taste} onChange={handleFilterChange}>
              <option value="">不限</option>
              {tasteOptions.map((taste) => (
                <option key={taste} value={taste}>
                  {taste}
                </option>
              ))}
            </select>
          </label>

          <label>
            难度
            <select
              name="difficulty"
              value={preferences.difficulty}
              onChange={handleFilterChange}
            >
              <option value="">不限</option>
              {difficultyOptions.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
          </label>

          <label>
            时间
            <select
              name="maxTime"
              value={preferences.maxTime}
              onChange={handleFilterChange}
            >
              <option value="">不限</option>
              <option value="15">15分钟内</option>
              <option value="20">20分钟内</option>
              <option value="30">30分钟内</option>
              <option value="60">60分钟内</option>
            </select>
          </label>
        </div>

        <label className="healthy-mode-option">
          <input
            checked={preferences.healthyMode}
            name="healthyMode"
            type="checkbox"
            onChange={handleFilterChange}
          />
          健康模式（优先低热量、低脂肪）
        </label>

        <div className="disliked-editor">
          <label>
            不喜欢的食材
            <div className="disliked-input-row">
              <input
                value={ingredientInput}
                onChange={(event) => setIngredientInput(event.target.value)}
                placeholder="例如：豆腐"
              />
              <button type="button" onClick={handleAddDislikedIngredient}>
                添加
              </button>
            </div>
          </label>

          {preferences.dislikedIngredients.length > 0 && (
            <div className="tag-list">
              {preferences.dislikedIngredients.map((ingredient) => (
                <button
                  key={ingredient}
                  type="button"
                  onClick={() => handleRemoveDislikedIngredient(ingredient)}
                >
                  {ingredient} ×
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="apply-filter-button" type="button" onClick={handleApplyFilters}>
          按偏好推荐
        </button>
      </div>

      <div className="ingredient-match-panel">
        <div>
          <h3>按现有食材推荐</h3>
          <p>输入家里已有的食材，用空格、逗号或顿号分隔。</p>
        </div>

        <div className="ingredient-match-row">
          <input
            value={availableIngredientText}
            onChange={(event) => setAvailableIngredientText(event.target.value)}
            placeholder="例如：鸡蛋 番茄 土豆"
          />
          <button type="button" onClick={handleMatchIngredients}>
            匹配菜谱
          </button>
        </div>

        {availableIngredients.length > 0 && (
          <p className="ingredient-match-summary">
            当前食材：{availableIngredients.join('、')}
          </p>
        )}

        {availableIngredients.length > 0 && matchedRecipes.length === 0 && (
          <p className="ingredient-match-empty">暂时没有匹配到菜谱。</p>
        )}

        {matchedRecipes.length > 0 && (
          <div className="recipe-list">
            {matchedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onFavoriteChange={handleFavoriteChange}
              />
            ))}
          </div>
        )}
      </div>

      {message && <p className="refresh-message">{message}</p>}

      <div className="recipe-list">
        {recommendedRecipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onFavoriteChange={handleFavoriteChange}
          />
        ))}
      </div>

      <div className="history-panel">
        <h3>最近 7 天推荐</h3>
        {historyItems.length === 0 ? (
          <p>还没有推荐记录，点击“换一换”试试。</p>
        ) : (
          <div className="history-list">
            {historyItems.map((item) => (
              <div className="history-item" key={item.date}>
                <strong>{item.date}</strong>
                <span>
                  {item.recipes.length > 0
                    ? item.recipes.map((recipe) => recipe.name).join('、')
                    : '没有找到对应菜谱'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link to="/favorites">进入我的收藏</Link>
    </section>
  )
}

export default Home
