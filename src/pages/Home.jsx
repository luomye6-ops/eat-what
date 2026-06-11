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

function cleanIngredientName(ingredient) {
  return ingredient
    .replace(/[0-9.]+/g, '')
    .replace(/半|少许|适量|个|颗|根|盒|片|瓣|勺|把|听|克|毫升|块|朵|段/g, '')
    .trim()
}

function getKnownIngredients() {
  const ingredientNames = recipes.flatMap((recipe) =>
    recipe.ingredients.map((ingredient) => cleanIngredientName(ingredient)),
  )

  return [...new Set(ingredientNames)].filter((ingredient) => ingredient.length > 0)
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

function getServingsNumber(servingsText) {
  const matchedNumbers = servingsText.match(/\d+/g)

  if (!matchedNumbers) {
    return []
  }

  return matchedNumbers.map((number) => Number(number))
}

function canServePeople(recipe, peopleCount) {
  if (!peopleCount) {
    return true
  }

  const servingNumbers = getServingsNumber(recipe.servings)

  if (servingNumbers.length === 1) {
    return servingNumbers[0] >= peopleCount
  }

  if (servingNumbers.length >= 2) {
    return peopleCount >= servingNumbers[0] && peopleCount <= servingNumbers[1]
  }

  return true
}

function parsePeopleCount(question) {
  const numberMatch = question.match(/(\d+)\s*人/)

  if (numberMatch) {
    return Number(numberMatch[1])
  }

  if (question.includes('一个人') || question.includes('一人')) {
    return 1
  }

  if (question.includes('两个人') || question.includes('二人')) {
    return 2
  }

  if (question.includes('三个人') || question.includes('三人')) {
    return 3
  }

  return ''
}

function parseQuestion(question) {
  const knownIngredients = getKnownIngredients()
  const tasteOptions = getUniqueOptions('taste')
  const ingredients = knownIngredients.filter((ingredient) => question.includes(ingredient))
  const directTaste = tasteOptions.find((taste) => question.includes(taste))
  const taste =
    directTaste ||
    (question.includes('辣') ? '微辣' : '') ||
    (question.includes('清淡') ? '清淡' : '') ||
    (question.includes('酸甜') ? '酸甜' : '')

  return {
    ingredients,
    taste,
    peopleCount: parsePeopleCount(question),
  }
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

function getQuestionRecommendedRecipes(parsedQuestion, history) {
  const favoriteIds = getFavorites()
  const hasIngredients = parsedQuestion.ingredients.length > 0

  return recipes
    .map((recipe) => {
      const matchCount = getIngredientMatchCount(recipe, parsedQuestion.ingredients)
      const matchesTaste = !parsedQuestion.taste || recipe.taste === parsedQuestion.taste
      const matchesPeople = canServePeople(recipe, parsedQuestion.peopleCount)
      const favoriteScore = favoriteIds.includes(recipe.id) ? 100 : 0
      const historyScore = getHistoryCount(recipe.id, history) * 10
      const matchScore = matchCount * 20
      const tasteScore = parsedQuestion.taste && matchesTaste ? 8 : 0
      const peopleScore = parsedQuestion.peopleCount && matchesPeople ? 5 : 0

      return {
        recipe,
        matchesTaste,
        matchesPeople,
        matchCount,
        score: favoriteScore + historyScore + matchScore + tasteScore + peopleScore,
      }
    })
    .filter((item) => {
      if (hasIngredients && item.matchCount === 0) {
        return false
      }

      return item.matchesTaste && item.matchesPeople
    })
    .sort((first, second) => second.score - first.score)
    .slice(0, 6)
    .map((item) => item.recipe)
}

// 首页展示筛选、用户偏好、食材匹配、AI 问答推荐和最近 7 天推荐历史。
function Home() {
  const [preferences, setPreferences] = useState(() => getPreferences())
  const [ingredientInput, setIngredientInput] = useState('')
  const [availableIngredientText, setAvailableIngredientText] = useState('')
  const [availableIngredients, setAvailableIngredients] = useState([])
  const [aiQuestion, setAiQuestion] = useState('')
  const [parsedQuestion, setParsedQuestion] = useState(null)
  const [aiRecommendedRecipes, setAiRecommendedRecipes] = useState([])
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

  function handleAskQuestion() {
    const question = aiQuestion.trim()

    if (!question) {
      setParsedQuestion(null)
      setAiRecommendedRecipes([])
      setMessage('请先输入一个问题')
      return
    }

    const nextParsedQuestion = parseQuestion(question)
    const nextRecipes = getQuestionRecommendedRecipes(nextParsedQuestion, history)

    setParsedQuestion(nextParsedQuestion)
    setAiRecommendedRecipes(nextRecipes)
    setMessage(
      nextRecipes.length > 0
        ? '已根据你的问题生成推荐'
        : '暂时没有找到符合问题的菜谱',
    )
  }

  function handleFavoriteChange() {
    setFavoriteVersion((currentVersion) => currentVersion + 1)

    if (parsedQuestion) {
      setAiRecommendedRecipes(getQuestionRecommendedRecipes(parsedQuestion, history))
    }
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

      <div className="ai-question-panel">
        <div>
          <h3>AI 问答推荐</h3>
          <p>用自然语言描述你想吃什么，例如“我有鸡蛋和番茄，2个人，想吃酸甜的”。</p>
        </div>

        <div className="ai-question-row">
          <input
            value={aiQuestion}
            onChange={(event) => setAiQuestion(event.target.value)}
            placeholder="例如：我有土豆和青椒，想吃简单一点的菜"
          />
          <button type="button" onClick={handleAskQuestion}>
            推荐
          </button>
        </div>

        {parsedQuestion && (
          <div className="parsed-question">
            <span>食材：{parsedQuestion.ingredients.join('、') || '未识别'}</span>
            <span>口味：{parsedQuestion.taste || '不限'}</span>
            <span>人数：{parsedQuestion.peopleCount || '不限'}</span>
          </div>
        )}

        {parsedQuestion && aiRecommendedRecipes.length === 0 && (
          <p className="ingredient-match-empty">暂时没有符合问题的菜谱。</p>
        )}

        {aiRecommendedRecipes.length > 0 && (
          <div className="recipe-list">
            {aiRecommendedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onFavoriteChange={handleFavoriteChange}
              />
            ))}
          </div>
        )}
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
