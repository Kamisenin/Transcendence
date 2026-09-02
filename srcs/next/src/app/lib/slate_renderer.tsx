import ImageElement from "@/components/page/editor/ImageElement"

export function renderElement(props: any) {
    if (props.element.type === "image") {
        return <ImageElement {...props} />;
    }
    return (
        <p {...props.attributes} className="min-h-[1.5em] my-1 outline-none">
            {props.children}
        </p>
    );
}

export function renderLeaf(props: any){
    const style: React.CSSProperties = {
        fontSize: props.leaf.fontSize || "16px",
        color: props.leaf.color || "#000000",
    };

    let children = props.children;

    if (props.leaf.bold) children = <strong>{children}</strong>;
    if (props.leaf.italic) children = <em>{children}</em>;
    if (props.leaf.underline) children = <u>{children}</u>;
    if (props.leaf.strikethrough) children = <s>{children}</s>;

    return (
        <span {...props.attributes} style={style}>
            {children}
        </span>
    );
}