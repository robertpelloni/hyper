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
			onMouseEnter={() => setVisible(true)}
			onMouseLeave={() => setVisible(false)}
		>
			{children || <span className="tn_tooltip_icon">?</span>}
			{visible && <span className="tn_tooltip_content">{text}</span>}
		</span>
	);
}
