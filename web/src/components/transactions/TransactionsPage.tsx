import { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { UserContext } from '../../services/user-context';
import { ReferrerService } from '../../services/ReferrerService';
import { Referrer } from '../../models';
import { Transaction } from '../../models';
import TransactionListView from './TransactionListView'


export default function TransactionsPage() {

    const [referrer] = useState<Referrer | null>(UserContext.getCurrentReferrer());
    const [transactions, setTransactions] = useState<Array<Transaction> | null>(null);
    const [stripeDashboardLink, setStripeDashboardLink] = useState<string | null>();
    const [requestingDashboard, setRequestingDashboard] = useState<boolean>(false);

    useEffect(() => {
        if (!transactions) {
            const importTransactionsLocal = async () => {
                const transactionsJSON = await ReferrerService.getTransactions(referrer?.id ?? "")
                setTransactions(transactionsJSON)
            }
            importTransactionsLocal()
        }
        if (!stripeDashboardLink && !requestingDashboard) {
            const requestLink = async () => {
                const link = await ReferrerService.generateExpressLoginLink(referrer?.id ?? "", window.location.pathname);
                if (link && link.link) {
                    setStripeDashboardLink(link.link);
                }
            }
            
            requestLink();
            setRequestingDashboard(true);
        }
    }, [stripeDashboardLink, referrer, requestingDashboard, transactions])

    const styles = {
        container: {
            marginTop: '28px'
        }
    }

    return (
        <Container style={styles.container}>
            <Row>
                <Col style={{ paddingTop: '38px' }}>
                    <div>Your transactions are listed here. The money will be available when the oil change is completed.</div>
                    <br/>
                    <a style={{ textAlign: 'right'}} href={stripeDashboardLink ?? ""}>View previous payouts in Stripe</a>
                    <hr/>
                    <h4 style={{ textAlign: 'center', paddingBottom: '8px' }}>Transactions</h4>
                    <TransactionListView transactions={transactions} />
                </Col>
            </Row>
        </Container>
    )
}