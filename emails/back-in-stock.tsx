// emails/back-in-stock.tsx
// React Email template for back-in-stock notifications

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface BackInStockEmailProps {
  productName: string;
  productImage: string | null;
  productPrice: string;
  productUrl: string;
}

export const BackInStockEmail = ({
  productName,
  productImage,
  productPrice,
  productUrl,
}: BackInStockEmailProps) => (
  <Html>
    <Head />
    <Preview>Good news! {productName} is back in stock</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={heading}>MiDuka</Heading>
        </Section>
        <Section style={content}>
          <Heading style={subHeading}>Good News!</Heading>
          <Text style={paragraph}>
            You asked us to notify you when <strong>{productName}</strong> was back in stock, and it just arrived!
          </Text>
          {productImage && (
            <Img
              src={productImage}
              width="300"
              height="300"
              alt={productName}
              style={image}
            />
          )}
          <Text style={price}>{productPrice}</Text>
          <Section style={buttonContainer}>
            <Button style={button} href={productUrl}>
              Shop Now
            </Button>
          </Section>
          <Text style={paragraph}>
            Items can sell out fast, so grab yours while it's available.
          </Text>
        </Section>
        <Hr style={hr} />
        <Section style={footer}>
          <Text style={footerText}>
            You received this email because you subscribed to a stock alert on MiDuka.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default BackInStockEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "16px",
  overflow: "hidden",
};

const header = {
  padding: "32px",
  textAlign: "center" as const,
  backgroundColor: "#3B82F6",
};

const heading = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
};

const content = {
  padding: "40px",
  textAlign: "center" as const,
};

const subHeading = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#1f2937",
  marginBottom: "16px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#4b5563",
};

const image = {
  margin: "24px auto",
  borderRadius: "12px",
  objectFit: "cover" as const,
};

const price = {
  fontSize: "22px",
  fontWeight: "bold",
  color: "#3B82F6",
  margin: "16px 0",
};

const buttonContainer = {
  margin: "32px 0",
};

const button = {
  backgroundColor: "#3B82F6",
  borderRadius: "12px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "16px 32px",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
};

const footer = {
  padding: "0 40px",
};

const footerText = {
  fontSize: "12px",
  lineHeight: "18px",
  color: "#9ca3af",
  textAlign: "center" as const,
};
