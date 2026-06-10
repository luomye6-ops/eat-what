// 收藏数据统一保存在 localStorage，组件不要直接操作 localStorage。
const FAVORITES_KEY = 'favoriteRecipes'

function readFavoritesFromStorage() {
  const savedFavorites = localStorage.getItem(FAVORITES_KEY)

  if (!savedFavorites) {
    return []
  }

  try {
    return JSON.parse(savedFavorites)
  } catch {
    return []
  }
}

// 获取收藏菜谱的 id 数组。旧数据如果保存的是完整菜谱，也会转换成 id。
export function getFavorites() {
  const favorites = readFavoritesFromStorage()

  return favorites
    .map((item) => {
      if (typeof item === 'number') {
        return item
      }

      return item.id
    })
    .filter((id) => typeof id === 'number')
}

export function saveFavorites(favoriteIds) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds))
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

// 兼容之前的函数名，后续页面优先使用 getFavorites / saveFavorites。
export const getFavoriteRecipes = getFavorites
export const saveFavoriteRecipes = saveFavorites
