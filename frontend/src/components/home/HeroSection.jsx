import { useState, useEffect } from 'react'
import GameShowcaseCard from './GameShowcaseCard'

// Mock data
const showcaseItems = [
  {
    id: 1,
    title: 'Genshin Impact',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&h=800&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=400&fit=crop',
    description: 'Step into Teyvat, a vast world teeming with life and flowing with elemental energy.',
    ctaText: 'Play Free Now',
  },
  {
    id: 2,
    title: 'EA SPORTS FC™ 26',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&h=800&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop',
    description: 'Mua TOTY Edition ngay. Nhận nhiều phần thưởng hấp dẫn.',
    ctaText: 'Mua ngay',
  },
  {
    id: 3,
    title: "John Carpenter's Toxic Commando",
    image: 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=1200&h=800&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=400&h=400&fit=crop',
    description: 'Face endless waves of grotesque mutants.',
    ctaText: 'Buy Now',
  },
  {
    id: 4,
    title: 'Resident Evil Requiem',
    image: 'https://images.unsplash.com/photo-1608889335941-32ac5f2041b9?w=1200&h=800&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1608889335941-32ac5f2041b9?w=400&h=400&fit=crop',
    description: 'Return to Raccoon City in the latest chapter.',
    ctaText: 'Pre-Order',
  },
  {
    id: 5,
    title: 'RIDE 6 - Ultimate Edition',
    image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&h=800&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400&h=400&fit=crop',
    description: 'Experience the most authentic motorcycle racing.',
    ctaText: 'Buy Now',
  },
]

const PROGRESS_DURATION = 4500 // animation time
const SLIDE_DELAY = 100        // hold after fill
const TICK = 50

export default function HeroSection({ games = showcaseItems }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setProgress(0)

    const progressTimer = setInterval(() => {
      setProgress((p) => {
        const next = p + 100 / (PROGRESS_DURATION / TICK)
        return next >= 100 ? 100 : next
      })
    }, TICK)

    return () => clearInterval(progressTimer)
  }, [currentIndex])

  useEffect(() => {
    if (progress < 100) return

    const delayTimer = setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % games.length)
    }, SLIDE_DELAY)

    return () => clearTimeout(delayTimer)
  }, [progress, games.length])

  const featured = games[currentIndex]

  const handleCardClick = (index) => {
    setCurrentIndex(index)
    setProgress(0)
  }

  return (
    <section className="relative bg-white text-gray-900 dark:bg-dark-900 dark:text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">

          <div className="relative rounded-xl overflow-hidden shadow-2xl min-h-150">
            <img
                src={featured.image}
                alt={featured.title}
                className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-linear-to-t from-white/90 via-white/60 to-transparent dark:from-black/80 dark:via-black/50 dark:to-transparent" />
            <div className="relative z-20 h-full p-10 flex flex-col justify-end text-gray-900 dark:text-white">
              <h1 className="text-5xl font-black mb-4">
                {featured.title}
              </h1>
              <p className="max-w-xl text-lg text-gray-600 dark:text-gray-300 mb-6">
                {featured.description}
              </p>
              <button className="w-fit px-6 py-3 rounded font-semibold transition bg-gold-500 text-gray-900 hover:bg-gold-600 dark:shadow-lg">
                {featured.ctaText}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {games.map((game, index) => (
              <GameShowcaseCard
                key={game.id}
                game={game}
                isActive={index === currentIndex}
                progress={index === currentIndex ? progress : 0}
                onClick={() => handleCardClick(index)}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
