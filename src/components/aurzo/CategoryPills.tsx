interface CategoryPillsProps {
    categories: string[];
    activeCategory: string;
    onSelect: (category: string) => void;
}

export function CategoryPills({ categories, activeCategory, onSelect }: CategoryPillsProps) {
    return (
        <div className="flex gap-2 overflow-x-auto scroll-hidden py-1 -mx-1 px-1">
            {categories.map((category) => (
                <button
                    key={category}
                    onClick={() => onSelect(category)}
                    className={`category-pill whitespace-nowrap shrink-0 ${activeCategory === category ? 'active' : ''
                        }`}
                >
                    {category}
                </button>
            ))}
        </div>
    );
}
