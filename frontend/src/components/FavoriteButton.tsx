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
      {loading ? '保存中...' : active ? '已收藏' : '收藏'}
    </button>
  )
}
