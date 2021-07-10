import { Container, Row, Col } from 'react-bootstrap';
import { UserContext } from '../services/user-context';
import { ReferrerService } from '../services/ReferrerService';
import { Referrer } from '../models';
import React from 'react';
import { OverlayTrigger, Overlay, Tooltip, Button } from 'react-bootstrap';
// import { ReactComponent as CopySVG } from '../resources/copy.svg'
import Colors from '../resources/Colors'
import CopySVG from './CopySVG'

export default function AffiliateDashboard() {

    const [referrer, setReferrer] = React.useState<Referrer | null>(UserContext.getCurrentReferrer());
    const [vanityLink, setVanityLink] = React.useState<string>("");
    const [requestingDashboard, setRequestingDashboard] = React.useState<boolean>(false);
    const [stripeDashboardLink, setStripeDashboardLink] = React.useState<string | null>();

    const [didCopyLink, setDidCopyLink] = React.useState<boolean>(false);

    React.useEffect(() => {
        if (referrer && referrer.vanityID) {
            const linkBase = process.env.REACT_APP_ENV === "production" ? "go.carswaddle.com/" : "carswaddle.test-app.link/";
            setVanityLink(`${linkBase}${referrer.vanityID}`)
            if (!stripeDashboardLink && !requestingDashboard) {
                const requestLink = async () => {
                    const link = await ReferrerService.generateExpressLoginLink(referrer.id ?? "");
                    if (link && link.link) {
                        setStripeDashboardLink(link.link);
                    }
                }
                requestLink();
                setRequestingDashboard(true);
            }
        }
    }, [referrer])

    function copyLink(vanityLink: string) {
        navigator.clipboard.writeText(vanityLink);
        setDidCopyLink(true);
    }

    const styles = {
        header: {
            width: '100%'
        },
        wrapper: {
            borderTop: 'black solid 1px',
            display: 'flex',
            flexWrap: 'wrap'
        },
        copyButton: {
            width: '20px',
            height: '20px',
            stroke: '#F0F',
            fill: Colors.brand,
        },
        button: {
            backgroundColor: Colors.background,
            borderWidth: 0,
        },
        tooltip: {
            
        }
    }

    return (
        <Container>
            <Row>
                <Col className="my-3" sm={{ span: 8, offset: 2 }} lg={{ span: 6, offset: 3 }}>
                    Use the personal link below to invite others to learn more about Car Swaddle and download the app.
                </Col>
            </Row>
            <Row className="my-4">
                <Col>
                    {vanityLink ?
                        <h4 className="text-center">Your affiliate link is <a href={`https://${vanityLink}`}>{vanityLink} </a>
                            <OverlayTrigger
                                placement='top'
                                overlay={
                                    <Tooltip id={`click-to-copy`}>
                                        {didCopyLink ? 'Copied' : 'Click to copy'}
                                    </Tooltip>
                                }
                                onExited={() => setDidCopyLink(false)}
                            >
                                <Button style={styles.button} onClick={() => setDidCopyLink(true)}>
                                    <CopySVG fill={styles.copyButton.fill}/>
                                </Button>
                            </OverlayTrigger>
                        </h4>
                        :
                        <h4 className="text-center">Unable to generate your affiliate link, please contact <a href="mailto:support@carswaddle.com">support@carswaddle.com</a></h4>
                    }
                </Col>
            </Row>
            <Row className="my-2">
                <Col>
                    {stripeDashboardLink ?
                        <h4 className="text-center"><a href={stripeDashboardLink}>Stripe dashboard <i className="fas fa-arrow-right"></i></a></h4>
                        :
                        <h4 className="text-center"></h4>
                    }
                </Col>
            </Row>
        </Container>
    )
}