import React from "react";
import EditorLayout from "../../layout/editor-layout";

const EditorLayoutPage = ({ children }: { children: React.ReactNode }) => {
  return (
    <EditorLayout>{children}</EditorLayout>
  );
};

export default EditorLayoutPage;