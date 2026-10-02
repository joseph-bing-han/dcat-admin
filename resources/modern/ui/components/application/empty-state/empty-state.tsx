"use client";
import type { ComponentPropsWithRef } from "react";
import { createContext, useContext } from "react";
import { SearchLg } from "@untitledui/icons";
import { FeaturedIcon as FeaturedIconbase } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";

interface RootContextProps {
    size?: "sm" | "md" | "lg";
}

const RootContext = createContext<RootContextProps>({ size: "lg" });

interface RootProps extends ComponentPropsWithRef<"div">, RootContextProps {}

const Root = ({ size = "lg", ...props }: RootProps) => {
    return (
        <RootContext.Provider value={{ size }}>
            <div {...props} className={cx("mx-auto flex w-full max-w-lg flex-col items-center justify-center", props.className)} />
        </RootContext.Provider>
    );
};

const FeaturedIcon = ({ color = "gray", theme = "modern", icon = SearchLg, size, ...props }: ComponentPropsWithRef<typeof FeaturedIconbase>) => {
    const { size: rootSize } = useContext(RootContext);

    return <FeaturedIconbase {...props} {...{ color, theme, icon }} size={!size && rootSize === "lg" ? "xl" : size || "lg"} />;
};

const Footer = (props: ComponentPropsWithRef<"div">) => {
    return <footer {...props} className={cx("z-10 flex gap-3", props.className)} />;
};

const Title = (props: ComponentPropsWithRef<"h2">) => {
    const { size } = useContext(RootContext);

    return (
        <h2
            {...props}
            className={cx(
                "text-md font-semibold text-primary",
                size === "md" && "text-lg font-semibold",
                size === "lg" && "text-xl font-semibold",
                props.className,
            )}
        />
    );
};

const Description = (props: ComponentPropsWithRef<"p">) => {
    const { size } = useContext(RootContext);

    return <p {...props} className={cx("text-center text-sm text-tertiary", size === "lg" && "text-md", props.className)} />;
};

export const EmptyState = Object.assign(Root, { FeaturedIcon, Footer, Title, Description });
