
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Text,
    Section,
} from '@react-email/components';
import * as React from 'react';

interface PaymentReceiptEmailProps {
    tenantName: string;
    propertyName: string;
    amount: number;
    receiptNumber: string;
}

export const PaymentReceiptEmail = ({
    tenantName,
    propertyName,
    amount,
    receiptNumber,
}: PaymentReceiptEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Payment Receipt for {propertyName}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Payment Received</Heading>
                    <Text style={text}>Hi {tenantName},</Text>
                    <Text style={text}>
                        We have received your payment of <strong>KES {amount.toLocaleString()}</strong> for{' '}
                        {propertyName}.
                    </Text>
                    <Section style={box}>
                        <Text style={paragraph}>
                            <strong>Receipt No:</strong> {receiptNumber}
                        </Text>
                        <Text style={paragraph}>
                            Please find your official PDF receipt attached to this email.
                        </Text>
                    </Section>
                    <Text style={footer}>
                        Thank you for using PropTraka.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

// Styles
const main = {
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    maxWidth: '560px',
};

const h1 = {
    color: '#112143',
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    margin: '30px 0',
};

const text = {
    color: '#333',
    fontSize: '16px',
    lineHeight: '26px',
};

const box = {
    padding: '20px',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
    marginTop: '20px',
};

const paragraph = {
    fontSize: '14px',
    lineHeight: '22px',
    margin: '0 0 10px',
};

const footer = {
    color: '#8898aa',
    fontSize: '12px',
    marginTop: '30px',
    textAlign: 'center' as const,
};

export default PaymentReceiptEmail;
