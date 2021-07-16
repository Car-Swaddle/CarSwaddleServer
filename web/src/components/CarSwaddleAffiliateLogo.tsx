import { NavDropdown, Row, Col } from "react-bootstrap";
import CarSwaddleLogo from "./CarSwaddleLogo";


type CarSwaddleAffiliateLogoProps = {
    width?: string,
}

export default function CarSwaddleAffiliateLogo({ width }: CarSwaddleAffiliateLogoProps) {
    return (
        <>
            <Row>
                <Col>
                    <CarSwaddleLogo width={width}/>
                </Col>
            </Row>
            <Row>
                <Col className="mb-3 text-center"><h1><b>Affiliate</b></h1></Col>
            </Row>
        </>
    )
}