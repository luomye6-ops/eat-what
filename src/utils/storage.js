// localStorage 相关工具函数后续放在这里。
const FAVORITES_KEY = 'favoriteRecipes'

export function getFavoriteRecipes() {
  const savedFavorites = localStorage.getItem(FAVORITES_KEY)

  if (!savedFavorites) {
    return []
  }

  return JSON.parse(savedFavorites)
}

export function saveFavoriteRecipes(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
}
