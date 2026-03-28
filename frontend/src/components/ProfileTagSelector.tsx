import { useMemo, useState } from 'react'

type ProfileTagSelectorProps = {
  label: string
  options: string[]
  selectedValues: string[]
  disabled?: boolean
  onChangeSelectedValues: (values: string[]) => void
}

const TAG_MAX_LENGTH = 12
const CUSTOM_TAG_LIMIT = 5
const TAG_PATTERN = /^[\u4e00-\u9fa5A-Za-z0-9_-]+$/

export function ProfileTagSelector({
  label,
  options,
  selectedValues,
  disabled = false,
  onChangeSelectedValues,
}: ProfileTagSelectorProps) {
  const [customTag, setCustomTag] = useState('')
  const [inputError, setInputError] = useState('')

  const builtInSelectedOptions = useMemo(
    () => options.filter((value) => selectedValues.includes(value)),
    [options, selectedValues],
  )

  const customSelectedOptions = useMemo(
    () => selectedValues.filter((value) => !options.includes(value)),
    [options, selectedValues],
  )

  const handleAddTag = () => {
    const segments = customTag
      .split(/[，,\n]+/)
      .map((item) => item.trim())
      .filter(Boolean)

    if (segments.length === 0) {
      setInputError('请输入标签内容')
      return
    }

    const nextSelectedValues = [...selectedValues]
    let nextCustomCount = customSelectedOptions.length

    for (const segment of segments) {
      if (segment.length > TAG_MAX_LENGTH) {
        setInputError(`单个标签长度不能超过${TAG_MAX_LENGTH}个字符`)
        return
      }

      if (!TAG_PATTERN.test(segment)) {
        setInputError('标签仅支持中文、英文、数字、下划线和短横线')
        return
      }

      const normalizedTag = segment.toLowerCase()
      const duplicated = [...options, ...nextSelectedValues].some(
        (value) => value.trim().toLowerCase() === normalizedTag,
      )

      if (duplicated) {
        setInputError(`标签“${segment}”已存在，无需重复添加`)
        return
      }

      if (nextCustomCount >= CUSTOM_TAG_LIMIT) {
        setInputError(`自定义标签最多添加${CUSTOM_TAG_LIMIT}个`)
        return
      }

      nextSelectedValues.push(segment)
      nextCustomCount += 1
    }

    setInputError('')
    onChangeSelectedValues(nextSelectedValues)
    setCustomTag('')
  }

  return (
    <div className="field-block tag-selector-block">
      <div className="tag-selector-card">
        <div className="tag-selector-header">
          <div>
            <label>{label}</label>
            <p>已选择{selectedValues.length}项，可直接点选预设项，也可补充少量自定义标签。</p>
          </div>
          <span className="tag-selector-count">
            预设{builtInSelectedOptions.length} · 自定义{customSelectedOptions.length}
          </span>
        </div>

        <div className="tag-selector-grid">
          <div className="tag-selector-panel">
            <div className="tag-selector-panel-head">
              <span>常用标签</span>
              <small>点击即可切换</small>
            </div>
            <div className="chip-group">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={builtInSelectedOptions.includes(option) ? 'chip active' : 'chip'}
                  disabled={disabled}
                  onClick={() =>
                    onChangeSelectedValues(
                      selectedValues.includes(option)
                        ? selectedValues.filter((value) => value !== option)
                        : [...selectedValues, option],
                    )
                  }
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="tag-selector-panel custom">
            <div className="tag-selector-panel-head">
              <span>自定义补充</span>
              <small>{customSelectedOptions.length}/{CUSTOM_TAG_LIMIT}</small>
            </div>

            {customSelectedOptions.length > 0 ? (
              <div className="chip-group">
                {customSelectedOptions.map((option) => (
                  <span key={option} className="custom-tag-chip">
                    <span>{option}</span>
                    <button
                      type="button"
                      className="custom-tag-remove"
                      disabled={disabled}
                      aria-label={`删除标签${option}`}
                      onClick={() =>
                        onChangeSelectedValues(selectedValues.filter((value) => value !== option))
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="tag-empty-hint">没有自定义标签时，保持空白即可，不必强行补充。</div>
            )}

            <div className="tag-input-row">
              <input
                type="text"
                className={inputError ? 'tag-input error' : 'tag-input'}
                value={customTag}
                disabled={disabled}
                placeholder={`输入自定义${label}，支持中文逗号或回车批量添加`}
                onChange={(event) => {
                  setCustomTag(event.target.value)
                  if (inputError) {
                    setInputError('')
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleAddTag()
                  }
                }}
              />
              <button
                type="button"
                className="secondary-button"
                disabled={disabled || customTag.trim() === '' || customSelectedOptions.length >= CUSTOM_TAG_LIMIT}
                onClick={handleAddTag}
              >
                新增标签
              </button>
            </div>
          </div>
        </div>
      </div>

      {inputError ? <div className="field-error">{inputError}</div> : null}
    </div>
  )
}
