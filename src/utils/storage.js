// 浏览器本地存储工具。组件通过这里读写数据，不直接操作 localStorage。
const FAVORITES_KEY = 'favoriteRecipes'
const PREFERENCES_KEY = 'recipePreferences'
const HISTORY_KEY = 'recommendationHistory'

function readJson(key, fallbackValue) {
  try {
    const savedValue = localStorage.getItem(key)

    if (!savedValue) {
      return fallbackValue
    }

    return JSON.parse(savedValue)
  } catch {
    return fallbackValue
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 如果浏览器禁用了 localStorage，先保持页面不崩溃。
  }
}

function readFavoritesFromStorage() {
  const parsedFavorites = readJson(FAVORITES_KEY, [])

  if (!Array.isArray(parsedFavorites)) {
    return []
  }

  return parsedFavorites
}

// 获取收藏菜谱的 id 数组。旧数据如果保存的是完整菜谱，也会转换成 id。
export function getFavorites() {
  const favorites = readFavoritesFromStorage()

  return favorites
    .map((item) => {
      if (typeof item === 'number') {
        return item
      }

      if (item && typeof item.id === 'number') {
        return item.id
      }

      return null
    })
    .filter((id) => typeof id === 'number')
}

export function saveFavorites(favoriteIds) {
  saveJson(FAVORITES_KEY, favoriteIds)
}

export function isFavoriteRecipe(recipeId) {
  const id = Number(recipeId)

  return getFavorites().includes(id)
}

export function toggleFavoriteRecipe(recipe) {
  const favoriteIds = getFavorites()
  const isAlreadyFavorite = favoriteIds.includes(recipe.id)

  if (isAlreadyFavorite) {
    const nextFavoriteIds = favoriteIds.filter((id) => id !== recipe.id)
    saveFavorites(nextFavoriteIds)
    return false
  }

  saveFavorites([...favoriteIds, recipe.id])
  return true
}

export function getPreferences() {
  const defaultPreferences = {
    taste: '',
    difficulty: '',
    maxTime: '',
    dislikedIngredients: [],
  }
  const savedPreferences = readJson(PREFERENCES_KEY, defaultPreferences)

  return {
    ...defaultPreferences,
    ...savedPreferences,
    dislikedIngredients: Array.isArray(savedPreferences.dislikedIngredients)
      ? savedPreferences.dislikedIngredients
      : [],
  }
}

export function savePreferences(preferences) {
  saveJson(PREFERENCES_KEY, preferences)
}

export function getRecommendationHistory() {
  const history = readJson(HISTORY_KEY, [])

  if (!Array.isArray(history)) {
    return []
  }

  return history.filter((item) => item && item.date && Array.isArray(item.recipeIds))
}

export function saveTodayRecommendation(recipeIds) {
  const today = new Date().toISOString().slice(0, 10)
  const historyWithoutToday = getRecommendationHistory().filter(
    (item) => item.date !== today,
  )
  const nextHistory = [
    { date: today, recipeIds },
    ...historyWithoutToday,
  ].slice(0, 7)

  saveJson(HISTORY_KEY, nextHistory)
  return nextHistory
}

// 兼容之前的函数名，后续页面优先使用 getFavorites / saveFavorites。
export const getFavoriteRecipes = getFavorites
export const saveFavoriteRecipes = saveFavorites
