import type { ShowcaseItem } from '@/components/showcase/showcase-grid'

/**
 * Cinematic showcase data for the T27 preview. Each entry pairs a
 * fictional brand with the Visual DNA / Product Moment combo Forgely
 * would auto-pick, plus a Pexels CC0 placeholder loop.
 *
 * Swap `videoSrc` / `poster` for Kling renders during private beta —
 * no other code change needed.
 */
export const showcaseItems: ShowcaseItem[] = [
  {
    id: 'toybloom',
    brand: 'Toybloom',
    category: 'Wooden toys',
    dna: 'Nordic Minimal',
    moment: 'M04 Breathing Still',
    gradient: 'from-[#E8E2D9] via-[#A89880] to-[#3F362F]',
    poster:
      'https://images.pexels.com/videos/3045163/free-video-3045163.jpg?auto=compress&cs=tinysrgb&w=1200',
    videoSrc: 'https://videos.pexels.com/video-files/3045163/3045163-uhd_2560_1440_30fps.mp4',
  },
  {
    id: 'kyoto-mujo',
    brand: 'Kyoto Mujo',
    category: 'Ceramic teaware',
    dna: 'Kyoto Ceramic',
    moment: 'M05 Droplet Ripple',
    gradient: 'from-[#FEFDFB] via-[#C7B299] to-[#2D2A26]',
    poster:
      'https://images.pexels.com/videos/3129957/free-video-3129957.jpg?auto=compress&cs=tinysrgb&w=1200',
    videoSrc: 'https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_30fps.mp4',
  },
  {
    id: 'ember-ash',
    brand: 'Ember & Ash',
    category: 'Fragrance',
    dna: 'Bold Rebellious',
    moment: 'M06 Mist Emergence',
    gradient: 'from-[#FF6B1A] via-[#7A0F2D] to-[#0E0E11]',
    poster:
      'https://images.pexels.com/videos/2611250/free-video-2611250.jpg?auto=compress&cs=tinysrgb&w=1200',
    videoSrc: 'https://videos.pexels.com/video-files/2611250/2611250-uhd_2560_1440_30fps.mp4',
  },
  {
    id: 'luma-wellness',
    brand: 'Luma Wellness',
    category: 'Supplements',
    dna: 'Clinical Wellness',
    moment: 'M08 Ingredient Ballet',
    gradient: 'from-[#0F2A28] via-[#1F5C56] to-[#FFD166]',
    poster:
      'https://images.pexels.com/videos/2715412/free-video-2715412.jpg?auto=compress&cs=tinysrgb&w=1200',
    videoSrc: 'https://videos.pexels.com/video-files/2715412/2715412-uhd_2560_1440_30fps.mp4',
  },
  {
    id: 'still-hours',
    brand: 'Still Hours',
    category: 'Watches',
    dna: 'Tech Precision',
    moment: 'M03 Light Sweep',
    gradient: 'from-[#0E0E11] via-[#3D3D45] to-[#D9D9DD]',
    poster:
      'https://images.pexels.com/videos/3045163/free-video-3045163.jpg?auto=compress&cs=tinysrgb&w=1200',
    videoSrc: 'https://videos.pexels.com/video-files/3045163/3045163-uhd_2560_1440_30fps.mp4',
  },
  {
    id: 'casa-verde',
    brand: 'Casa Verde',
    category: 'Organic tableware',
    dna: 'Organic Garden',
    moment: 'M10 Environmental Embed',
    gradient: 'from-[#1F2A1B] via-[#5A7A48] to-[#E6E3CF]',
    poster:
      'https://images.pexels.com/videos/3129957/free-video-3129957.jpg?auto=compress&cs=tinysrgb&w=1200',
    videoSrc: 'https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_30fps.mp4',
  },
]
