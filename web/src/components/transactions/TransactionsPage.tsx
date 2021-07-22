import { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { UserContext } from '../../services/user-context';
import { ReferrerService } from '../../services/ReferrerService';
import { Referrer } from '../../models';
import { Transaction } from '../../models';
import TransactionListView from './TransactionListView'


export default function TransactionsPage() {

    const [referrer] = useState<Referrer | null>(UserContext.getCurrentReferrer());
    const [transactions, setTransactions] = useState<Array<Transaction> | null>();

    useEffect(() => {
        if (!transactions) {
            importTransactions()
        }
    })

    async function importTransactions() {
        const transactionsJSON = await ReferrerService.getTransactions(referrer?.id ?? "")
        setTransactions(transactionsJSON)
    }

    const styles = {
        container: {
            marginTop: '28px'
        }
    }

    return (
        <Container style={styles.container}>
            <Row>
                <Col md={4}>
                    You transactions are listed here. The money will get to your bank account as soon as the oil change is completed.
                </Col>
                <Col md={8}>
                    <TransactionListView transactions={transactions ?? []} />
                </Col>
            </Row>
        </Container>
    )
}