type FavoriteButtonProps = {
  active: boolean
  loading?: boolean
  onClick: () => void
}

export function FavoriteButton({ active, loading = false, onClick }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      className={active ? 'icon-button active' : 'icon-button'}
      disabled={loading}
      onClick={onClick}
    >
      {loading ? '处理中...' : active ? '取消收藏' : '加入收藏'}
    </button>
  )
}
