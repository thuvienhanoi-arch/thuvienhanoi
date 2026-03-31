import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Đã xảy ra lỗi không mong muốn.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsedError = JSON.parse(this.state.error.message);
          if (parsedError.operationType && parsedError.authInfo) {
            isFirestoreError = true;
            errorMessage = `Lỗi Firestore (${parsedError.operationType}): ${parsedError.error}`;
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full border-destructive/50 shadow-2xl shadow-destructive/10">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-destructive" size={32} />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">Rất tiếc!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <p className="text-muted-foreground">
                {isFirestoreError 
                  ? "Ứng dụng gặp sự cố khi truy cập dữ liệu. Vui lòng kiểm tra kết nối hoặc quyền hạn của bạn."
                  : "Ứng dụng đã gặp sự cố và không thể tiếp tục."}
              </p>
              
              <div className="p-4 bg-muted rounded-lg text-left overflow-auto max-h-40">
                <code className="text-xs text-destructive break-words">
                  {errorMessage}
                </code>
              </div>

              <Button 
                onClick={this.handleReset}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 rounded-xl"
              >
                <RefreshCcw className="mr-2" size={20} /> Tải lại ứng dụng
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
