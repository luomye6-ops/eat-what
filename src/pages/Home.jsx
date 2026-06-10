import RecipeCard from '../components/RecipeCard.jsx'

// 首页占位内容。后续会展示推荐菜谱列表。
function Home() {
  return (
    <section>
      <h2>今天吃啥</h2>
      <p>这里将展示今日推荐菜谱。</p>
      <RecipeCard />
    </section>
  )
}

export default Home
