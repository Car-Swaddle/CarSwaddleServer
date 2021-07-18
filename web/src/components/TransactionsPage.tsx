import { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { UserContext } from '../services/user-context';
import { ReferrerService } from '../services/ReferrerService';
import { Referrer } from '../models';
import { Transaction } from '../models';
import TransactionListView from './transactions/TransactionListView'


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

    return (
        <Container>
            <Row>
                <TransactionListView transactions={transactions ?? []} />
            </Row>
        </Container>
    )
}