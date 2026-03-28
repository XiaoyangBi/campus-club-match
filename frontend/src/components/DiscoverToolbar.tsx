import type { Category, SortType } from '../types'
import { sortLabelMap } from '../utils/recommendation'

type DiscoverToolbarProps = {
  categories: Category[]
  keyword: string
  selectedCategory: Category
  sortType: SortType
  onKeywordChange: (value: string) => void
  onCategoryChange: (value: Category) => void
  onSortChange: (value: SortType) => void
}

export function DiscoverToolbar({
  categories,
  keyword,
  selectedCategory,
  sortType,
  onKeywordChange,
  onCategoryChange,
  onSortChange,
}: DiscoverToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-search">
        <span className="toolbar-label">关键词检索</span>
        <input
          type="text"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="搜索社团名、标签或关键词"
        />
      </div>

      <div className="toolbar-row">
        <div className="toolbar-block">
          <span className="toolbar-label">社团分类</span>
          <div className="chip-group compact">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={selectedCategory === category ? 'chip active' : 'chip'}
                onClick={() => onCategoryChange(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-block">
          <span className="toolbar-label">排序方式</span>
          <div className="sort-group">
            {(['matchScore', 'deadline', 'hot'] as SortType[]).map((item) => (
              <button
                key={item}
                type="button"
                className={sortType === item ? 'sort-pill active' : 'sort-pill'}
                onClick={() => onSortChange(item)}
              >
                {sortLabelMap[item]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
