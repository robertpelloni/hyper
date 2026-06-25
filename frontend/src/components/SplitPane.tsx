import React from "react";

interface SplitPaneProps {
	direction: "horizontal" | "vertical";
	children: React.ReactNode[];
	sizes?: number[];
	onResize?: (sizes: number[]) => void;
	borderColor?: string;
}

export default function SplitPane({
	direction,
	children,
	sizes,
	onResize,
	borderColor,
}: SplitPaneProps) {
	const childArray = React.Children.toArray(children);
	if (childArray.length <= 1) {
		return <>{childArray}</>;
	}

	const totalPanes = childArray.length;
	const defaultSizes = sizes || Array(totalPanes).fill(1 / totalPanes);

	return (
		<div className={`tn_split_pane ${direction}`}>
			{childArray.map((child, i) => (
				<React.Fragment key={i}>
					<div
						className="tn_term_pane"
						style={{
							flex: `${defaultSizes[i] || 1} 1 0%`,
							overflow: "hidden",
						}}
					>
						{child}
					</div>
					{i < childArray.length - 1 && (
						<div
							className={`tn_split_divider ${direction}`}
							style={{
								borderColor: borderColor || "#333",
							}}
							onMouseDown={(e) => {
								e.preventDefault();
								const startX = e.clientX;
								const startY = e.clientY;
								const container = (e.target as HTMLElement).parentElement!;
								const containerSize =
									direction === "vertical"
										? container.clientWidth
										: container.clientHeight;

								const handleMove = (moveEvent: MouseEvent) => {
									const delta =
										direction === "vertical"
											? moveEvent.clientX - startX
											: moveEvent.clientY - startY;
									const ratio = delta / containerSize;

									const newSizes = [...defaultSizes];
									const sum = newSizes[i] + newSizes[i + 1];
									newSizes[i] = Math.max(
										0.1,
										Math.min(0.9, newSizes[i] + ratio),
									);
									newSizes[i + 1] = sum - newSizes[i];

									if (onResize) {
										onResize(newSizes);
									}
								};

								const handleUp = () => {
									document.removeEventListener("mousemove", handleMove);
									document.removeEventListener("mouseup", handleUp);
								};

								document.addEventListener("mousemove", handleMove);
								document.addEventListener("mouseup", handleUp);
							}}
						/>
					)}
				</React.Fragment>
			))}
		</div>
	);
}
