import React, { useState } from "react";

interface TooltipProps {
	text: string;
	children?: React.ReactNode;
}

export default function Tooltip({ text, children }: TooltipProps) {
	const [visible, setVisible] = useState(false);

	return (
		<span
			className="tn_tooltip_wrapper"
			tabIndex={0}
			role="tooltip"
			aria-label={text}
			onMouseEnter={() => setVisible(true)}
			onMouseLeave={() => setVisible(false)}
			onFocus={() => setVisible(true)}
			onBlur={() => setVisible(false)}
			onKeyDown={(e) => {
				if (e.key === "Escape") setVisible(false);
			}}
		>
			{children || <span className="tn_tooltip_icon" aria-hidden="true">?</span>}
			{visible && (
				<span className="tn_tooltip_content" role="status">
					{text}
				</span>
			)}
		</span>
	);
}
